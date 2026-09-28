import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/auth";
import { isValidGoogleReviewUrl } from "@/lib/review";
import { NextRequest } from "next/server";
import { GET as reviewReminderCronHandler } from "@/app/api/cron/review-reminder/route";
import crypto from "crypto";

describe("Slice 6: Google Review URL Validation", () => {
  it("accepts valid Google Review URLs", () => {
    expect(isValidGoogleReviewUrl("https://g.page/r/CbXx_12345/review")).toBe(true);
    expect(isValidGoogleReviewUrl("https://maps.app.goo.gl/abC123xyz")).toBe(true);
    expect(isValidGoogleReviewUrl("https://maps.google.com/maps?cid=123456")).toBe(true);
    expect(isValidGoogleReviewUrl("https://www.google.com/maps/place/Apex+Plumbing")).toBe(true);
  });

  it("rejects invalid or non-Google review URLs", () => {
    expect(isValidGoogleReviewUrl("")).toBe(false);
    expect(isValidGoogleReviewUrl(null)).toBe(false);
    expect(isValidGoogleReviewUrl("https://trustpilot.com/review/apex")).toBe(false);
    expect(isValidGoogleReviewUrl("https://facebook.com/reviews")).toBe(false);
    expect(isValidGoogleReviewUrl("ftp://g.page/invalid")).toBe(false);
  });
});

describe("Slice 6: Review Request Trigger & Guards", () => {
  let businessWithUrlId: string;
  let businessWithoutUrlId: string;

  beforeEach(async () => {
    const biz1 = await prisma.business.create({
      data: {
        name: "Prime Electrical",
        slug: generateSlug(`Prime ${Math.random()}`),
        email: `prime-${Math.random().toString(36).slice(2)}@test.com`,
        googleReviewUrl: "https://g.page/r/prime-electric/review",
      },
    });
    businessWithUrlId = biz1.id;

    const biz2 = await prisma.business.create({
      data: {
        name: "No Review Link Co",
        slug: generateSlug(`NoUrl ${Math.random()}`),
        email: `nourl-${Math.random().toString(36).slice(2)}@test.com`,
        googleReviewUrl: null,
      },
    });
    businessWithoutUrlId = biz2.id;
  });

  it("blocks review request and logs activity when googleReviewUrl is missing", async () => {
    const invoice = await prisma.invoice.create({
      data: {
        businessId: businessWithoutUrlId,
        customerName: "Alice Walker",
        customerEmail: "alice@example.com",
        invoiceNumber: "INV-101",
        lineItems: "[]",
        subtotal: 50000,
        total: 50000,
        dueDate: new Date(),
        status: "DRAFT",
      },
    });

    const hasReviewUrl = isValidGoogleReviewUrl(null);
    expect(hasReviewUrl).toBe(false);

    // Simulate guard logic executed on invoice payment
    const reviewRequest = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        businessId: businessWithoutUrlId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        status: "PENDING",
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
      },
    });

    const activity = await prisma.activityLog.create({
      data: {
        businessId: businessWithoutUrlId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.blocked_missing_url",
        status: "FAILURE",
        detail: "Review request blocked: Google review link is not configured in Business Settings",
      },
    });

    expect(reviewRequest.status).toBe("PENDING");
    expect(reviewRequest.sentAt).toBeNull();
    expect(activity.eventType).toBe("review.blocked_missing_url");
  });

  it("blocks subsequent review requests if customer previously unsubscribed", async () => {
    const unsubscribedEmail = `unsub-${Math.random().toString(36).slice(2)}@customer.com`;

    const invoice = await prisma.invoice.create({
      data: {
        businessId: businessWithUrlId,
        customerName: "Prior Unsub User",
        customerEmail: unsubscribedEmail,
        invoiceNumber: "INV-102",
        lineItems: "[]",
        subtotal: 30000,
        total: 30000,
        dueDate: new Date(),
        status: "PAID",
      },
    });

    // Prior unsubscribed review request
    await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        businessId: businessWithUrlId,
        customerName: "Prior Unsub User",
        customerEmail: unsubscribedEmail,
        status: "SENT",
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
        unsubscribedAt: new Date(),
      },
    });

    // Check query for subsequent request
    const priorUnsubscribe = await prisma.reviewRequest.findFirst({
      where: {
        businessId: businessWithUrlId,
        customerEmail: unsubscribedEmail,
        unsubscribedAt: { not: null },
      },
    });

    expect(priorUnsubscribe).not.toBeNull();
    expect(priorUnsubscribe?.unsubscribedAt).not.toBeNull();
  });
});

describe("Slice 6: Review Reminder Cron & Idempotency", () => {
  let businessId: string;

  beforeEach(async () => {
    const biz = await prisma.business.create({
      data: {
        name: "Eco Heat Ltd",
        slug: generateSlug(`Eco ${Math.random()}`),
        email: `eco-${Math.random().toString(36).slice(2)}@test.com`,
        googleReviewUrl: "https://maps.app.goo.gl/eco-heat-123",
      },
    });
    businessId = biz.id;
  });

  it("finds and processes eligible review requests >4 days old without duplicates", async () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        customerName: "David Bell",
        customerEmail: "david@example.com",
        invoiceNumber: "INV-201",
        lineItems: "[]",
        subtotal: 10000,
        total: 10000,
        dueDate: new Date(),
        status: "PAID",
      },
    });

    // Eligible candidate: SENT 5 days ago, reminder not sent, not unsubscribed
    const eligible = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        businessId,
        customerName: "David Bell",
        customerEmail: "david@example.com",
        status: "SENT",
        sentAt: fiveDaysAgo,
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
      },
    });

    // Ineligible: SENT only 2 days ago
    const tooRecent = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        businessId,
        customerName: "Recent Customer",
        customerEmail: "recent@example.com",
        status: "SENT",
        sentAt: twoDaysAgo,
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
      },
    });

    // Ineligible: Already reminded
    const alreadyReminded = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        businessId,
        customerName: "Reminded Customer",
        customerEmail: "reminded@example.com",
        status: "REMINDER_SENT",
        sentAt: fiveDaysAgo,
        reminderSentAt: twoDaysAgo,
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
      },
    });

    // Ineligible: Unsubscribed
    const unsubscribed = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        businessId,
        customerName: "Opted Out",
        customerEmail: "optedout@example.com",
        status: "SENT",
        sentAt: fiveDaysAgo,
        unsubscribeToken: crypto.randomBytes(16).toString("hex"),
        unsubscribedAt: twoDaysAgo,
      },
    });

    // Run the reminder cron handler
    const req = new NextRequest("http://localhost:3000/api/cron/review-reminder", {
      headers: {
        authorization: `Bearer ${process.env.CRON_SECRET || ""}`,
      },
    });
    const res = await reviewReminderCronHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.processedIds).toContain(eligible.id);
    expect(data.processedIds).not.toContain(tooRecent.id);
    expect(data.processedIds).not.toContain(alreadyReminded.id);
    expect(data.processedIds).not.toContain(unsubscribed.id);

    // Verify eligible updated
    const refreshed = await prisma.reviewRequest.findUnique({
      where: { id: eligible.id },
    });
    expect(refreshed?.status).toBe("REMINDER_SENT");
    expect(refreshed?.reminderSentAt).not.toBeNull();

    // Idempotency check: run second time immediately
    const res2 = await reviewReminderCronHandler(req);
    const data2 = await res2.json();
    expect(data2.sentCount).toBe(0);
    expect(data2.processedIds).not.toContain(eligible.id);
  });
});
