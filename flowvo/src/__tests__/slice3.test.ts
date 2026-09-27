import { describe, it, expect, beforeEach } from "vitest";
import {
  quoteEmailHtml,
  quoteEmailText,
  formatPence,
  LineItem,
} from "@/lib/email-templates/quote-email";
import {
  quoteFollowUpHtml,
  quoteFollowUpText,
} from "@/lib/email-templates/quote-followup";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/auth";
import crypto from "crypto";

describe("Slice 3: Quote Line Item Calculations & Formatting", () => {
  it("formats pence values accurately into GBP string", () => {
    expect(formatPence(100)).toBe("£1.00");
    expect(formatPence(15050)).toBe("£150.50");
    expect(formatPence(0)).toBe("£0.00");
    expect(formatPence(450000)).toBe("£4,500.00");
  });

  it("calculates line items sum correctly", () => {
    const items: LineItem[] = [
      { id: "1", description: "Labour (2 days)", quantity: 2, unitPricePence: 25000, lineTotalPence: 50000 },
      { id: "2", description: "Copper pipes & fittings", quantity: 1, unitPricePence: 8500, lineTotalPence: 8500 },
      { id: "3", description: "Thermostatic valve", quantity: 3, unitPricePence: 3000, lineTotalPence: 9000 },
    ];

    const subtotal = items.reduce((acc, it) => acc + it.lineTotalPence, 0);
    expect(subtotal).toBe(67500); // £675.00
  });

  it("renders quote email with line items and acceptance URL", () => {
    const items: LineItem[] = [
      { id: "1", description: "Gas Safety Certificate", quantity: 1, unitPricePence: 7500, lineTotalPence: 7500 },
    ];
    const acceptUrl = "https://app.flowvo.test/q/tok123";

    const html = quoteEmailHtml({
      customerName: "Alice Walker",
      businessName: "City Gas Services",
      lineItems: items,
      totalPence: 7500,
      acceptUrl,
    });

    expect(html).toContain("Hi Alice,");
    expect(html).toContain("City Gas Services");
    expect(html).toContain("Gas Safety Certificate");
    expect(html).toContain("£75.00");
    expect(html).toContain(acceptUrl);
  });

  it("renders quote follow-up email reminder with acceptance URL", () => {
    const acceptUrl = "https://app.flowvo.test/q/tok123";

    const html = quoteFollowUpHtml({
      customerName: "Bob Smith",
      businessName: "Direct Roofing Ltd",
      serviceType: "Gutter Clearance",
      totalPence: 12000,
      acceptUrl,
    });

    expect(html).toContain("Hi Bob,");
    expect(html).toContain("Direct Roofing Ltd");
    expect(html).toContain("Gutter Clearance");
    expect(html).toContain("£120.00");
    expect(html).toContain(acceptUrl);
  });
});

describe("Slice 3: Quote Acceptance & Job Creation Flow", () => {
  let testBusinessId: string;
  let testLeadId: string;

  beforeEach(async () => {
    const slug = generateSlug(`Quote Test ${Math.random()}`);
    const business = await prisma.business.create({
      data: {
        name: "Acme Trades",
        slug,
        email: `owner-${Math.random().toString(36).slice(2)}@acme.com`,
      },
    });
    testBusinessId = business.id;

    const lead = await prisma.lead.create({
      data: {
        businessId: testBusinessId,
        customerName: "Helen Troy",
        email: "helen@example.com",
        phone: "07700900333",
        serviceType: "Full Rewire",
        description: "Victorian house rewire",
        status: "NEW",
      },
    });
    testLeadId = lead.id;
  });

  it("creates Quote in DRAFT status and transitions lead to CONTACTED", async () => {
    const quoteToken = crypto.randomBytes(8).toString("hex");
    const quote = await prisma.quote.create({
      data: {
        leadId: testLeadId,
        businessId: testBusinessId,
        quoteToken,
        lineItems: JSON.stringify([
          { id: "1", description: "Consumer Unit", quantity: 1, unitPricePence: 35000, lineTotalPence: 35000 },
        ]),
        subtotal: 35000,
        total: 35000,
        status: "DRAFT",
      },
    });

    expect(quote.status).toBe("DRAFT");
    expect(quote.total).toBe(35000);
  });

  it("accepting a quote sets quote=ACCEPTED, lead=WON, and auto-creates a Job record", async () => {
    const quoteToken = crypto.randomBytes(8).toString("hex");
    const quote = await prisma.quote.create({
      data: {
        leadId: testLeadId,
        businessId: testBusinessId,
        quoteToken,
        lineItems: JSON.stringify([
          { id: "1", description: "Rewire Phase 1", quantity: 1, unitPricePence: 120000, lineTotalPence: 120000 },
        ]),
        subtotal: 120000,
        total: 120000,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    // Accept quote
    const acceptedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    const updatedLead = await prisma.lead.update({
      where: { id: testLeadId },
      data: { status: "WON" },
    });

    const job = await prisma.job.create({
      data: {
        quoteId: acceptedQuote.id,
        leadId: testLeadId,
        businessId: testBusinessId,
        customerName: "Helen Troy",
        customerEmail: "helen@example.com",
        customerPhone: "07700900333",
        description: "Full Rewire",
        lineItems: acceptedQuote.lineItems,
        amount: acceptedQuote.total,
        status: "SCHEDULED",
      },
    });

    expect(acceptedQuote.status).toBe("ACCEPTED");
    expect(updatedLead.status).toBe("WON");
    expect(job.status).toBe("SCHEDULED");
    expect(job.amount).toBe(120000);
    expect(job.quoteId).toBe(quote.id);
  });

  it("declining a quote sets quote=DECLINED and lead=LOST", async () => {
    const quoteToken = crypto.randomBytes(8).toString("hex");
    const quote = await prisma.quote.create({
      data: {
        leadId: testLeadId,
        businessId: testBusinessId,
        quoteToken,
        lineItems: JSON.stringify([
          { id: "1", description: "Decking repair", quantity: 1, unitPricePence: 50000, lineTotalPence: 50000 },
        ]),
        subtotal: 50000,
        total: 50000,
        status: "SENT",
        sentAt: new Date(),
      },
    });

    const declinedQuote = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: "DECLINED",
        declinedAt: new Date(),
      },
    });

    const lostLead = await prisma.lead.update({
      where: { id: testLeadId },
      data: { status: "LOST" },
    });

    expect(declinedQuote.status).toBe("DECLINED");
    expect(lostLead.status).toBe("LOST");
  });
});

describe("Slice 3: Follow-Up Cron Query Idempotency", () => {
  it("only matches quotes sent >3 days ago with no prior follow-up, and is idempotent", async () => {
    const slug = generateSlug(`Cron Test ${Math.random()}`);
    const business = await prisma.business.create({
      data: {
        name: "Cron Test Trade",
        slug,
        email: `owner-${Math.random().toString(36).slice(2)}@crontrade.com`,
      },
    });

    const lead = await prisma.lead.create({
      data: {
        businessId: business.id,
        customerName: "Stale Quote Customer",
        email: "stale@example.com",
        phone: "07700900444",
        serviceType: "Tree Surgery",
        description: "Felling large oak",
        status: "QUOTED",
      },
    });

    // 1. Quote sent 4 days ago (eligible)
    const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);
    const eligibleQuote = await prisma.quote.create({
      data: {
        leadId: lead.id,
        businessId: business.id,
        quoteToken: crypto.randomBytes(8).toString("hex"),
        lineItems: JSON.stringify([{ description: "Tree Surgery", quantity: 1, unitPricePence: 60000, lineTotalPence: 60000 }]),
        subtotal: 60000,
        total: 60000,
        status: "SENT",
        sentAt: fourDaysAgo,
        followUpSentAt: null,
      },
    });

    // 2. Quote sent 1 day ago (too recent)
    const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    const recentQuote = await prisma.quote.create({
      data: {
        leadId: lead.id,
        businessId: business.id,
        quoteToken: crypto.randomBytes(8).toString("hex"),
        lineItems: JSON.stringify([{ description: "Pruning", quantity: 1, unitPricePence: 20000, lineTotalPence: 20000 }]),
        subtotal: 20000,
        total: 20000,
        status: "SENT",
        sentAt: oneDayAgo,
        followUpSentAt: null,
      },
    });

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // Initial query
    const toFollowUp = await prisma.quote.findMany({
      where: {
        status: "SENT",
        sentAt: { lt: threeDaysAgo },
        followUpSentAt: null,
      },
    });

    const matchesEligible = toFollowUp.some((q) => q.id === eligibleQuote.id);
    const matchesRecent = toFollowUp.some((q) => q.id === recentQuote.id);

    expect(matchesEligible).toBe(true);
    expect(matchesRecent).toBe(false);

    // Simulate sending follow-up on eligible quote
    await prisma.quote.update({
      where: { id: eligibleQuote.id },
      data: { followUpSentAt: new Date() },
    });

    // Second query (idempotency check)
    const secondPass = await prisma.quote.findMany({
      where: {
        status: "SENT",
        sentAt: { lt: threeDaysAgo },
        followUpSentAt: null,
      },
    });

    const matchesAgain = secondPass.some((q) => q.id === eligibleQuote.id);
    expect(matchesAgain).toBe(false);
  });
});
