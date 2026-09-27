import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/auth";
import { getNextInvoiceNumber } from "@/lib/invoice";
import { NextRequest } from "next/server";
import { POST as bounceWebhookHandler } from "@/app/api/webhooks/resend/route";
import { GET as overdueCronHandler } from "@/app/api/cron/invoice-overdue/route";

describe("Slice 5: Invoice Number Generation", () => {
  let businessAId: string;
  let businessBId: string;

  beforeEach(async () => {
    const bizA = await prisma.business.create({
      data: {
        name: "Business Alpha",
        slug: generateSlug(`Alpha ${Math.random()}`),
        email: `alpha-${Math.random().toString(36).slice(2)}@test.com`,
      },
    });
    businessAId = bizA.id;

    const bizB = await prisma.business.create({
      data: {
        name: "Business Beta",
        slug: generateSlug(`Beta ${Math.random()}`),
        email: `beta-${Math.random().toString(36).slice(2)}@test.com`,
      },
    });
    businessBId = bizB.id;
  });

  it("generates sequential invoice numbers per business starting at INV-001", async () => {
    const num1 = await getNextInvoiceNumber(businessAId);
    expect(num1).toBe("INV-001");

    await prisma.invoice.create({
      data: {
        businessId: businessAId,
        customerName: "Client One",
        customerEmail: "client1@example.com",
        invoiceNumber: num1,
        lineItems: JSON.stringify([{ description: "Labor", quantity: 1, unitPricePence: 10000, lineTotalPence: 10000 }]),
        subtotal: 10000,
        total: 10000,
        dueDate: new Date(),
        status: "DRAFT",
      },
    });

    const num2 = await getNextInvoiceNumber(businessAId);
    expect(num2).toBe("INV-002");

    // Business B should still start at INV-001
    const numB1 = await getNextInvoiceNumber(businessBId);
    expect(numB1).toBe("INV-001");
  });
});

describe("Slice 5: Overdue Cron Query and Processing", () => {
  let businessId: string;

  beforeEach(async () => {
    const biz = await prisma.business.create({
      data: {
        name: "Overdue Test Heating",
        slug: generateSlug(`Overdue ${Math.random()}`),
        email: `overdue-${Math.random().toString(36).slice(2)}@test.com`,
      },
    });
    businessId = biz.id;
  });

  it("sets past-due SENT invoices to OVERDUE and writes activity log", async () => {
    const pastDueDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    const futureDueDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // 5 days in future

    // Overdue candidate: SENT and past due date
    const overdueCandidate = await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Late Payer",
        customerEmail: "late@example.com",
        invoiceNumber: "INV-088",
        lineItems: "[]",
        subtotal: 25000,
        total: 25000,
        dueDate: pastDueDate,
        status: "SENT",
      },
    });

    // Not overdue: SENT but future due date
    const futureInvoice = await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Future Payer",
        customerEmail: "future@example.com",
        invoiceNumber: "INV-089",
        lineItems: "[]",
        subtotal: 30000,
        total: 30000,
        dueDate: futureDueDate,
        status: "SENT",
      },
    });

    // Not overdue: past due date but already PAID
    const paidInvoice = await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Already Paid",
        customerEmail: "paid@example.com",
        invoiceNumber: "INV-090",
        lineItems: "[]",
        subtotal: 15000,
        total: 15000,
        dueDate: pastDueDate,
        status: "PAID",
      },
    });

    // Run the cron handler
    const req = new NextRequest("http://localhost:3000/api/cron/invoice-overdue");
    const res = await overdueCronHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ok).toBe(true);
    expect(data.updatedIds).toContain(overdueCandidate.id);

    // Verify database state
    const refreshedOverdue = await prisma.invoice.findUnique({
      where: { id: overdueCandidate.id },
    });
    expect(refreshedOverdue?.status).toBe("OVERDUE");

    const refreshedFuture = await prisma.invoice.findUnique({
      where: { id: futureInvoice.id },
    });
    expect(refreshedFuture?.status).toBe("SENT");

    const refreshedPaid = await prisma.invoice.findUnique({
      where: { id: paidInvoice.id },
    });
    expect(refreshedPaid?.status).toBe("PAID");

    // Check ActivityLog
    const activity = await prisma.activityLog.findFirst({
      where: {
        invoiceId: overdueCandidate.id,
        eventType: "invoice.overdue",
      },
    });
    expect(activity).not.toBeNull();
    expect(activity?.status).toBe("SUCCESS");
  });
});

describe("Slice 5: Resend Bounce Webhook", () => {
  let businessId: string;

  beforeEach(async () => {
    const biz = await prisma.business.create({
      data: {
        name: "Bounce Test Co",
        slug: generateSlug(`Bounce ${Math.random()}`),
        email: `bounce-${Math.random().toString(36).slice(2)}@test.com`,
      },
    });
    businessId = biz.id;
  });

  it("updates emailDeliveryStatus to BOUNCED on bounce event", async () => {
    const bouncedCustomerEmail = `bounced-${Math.random().toString(36).slice(2)}@invalid-domain-test.co.uk`;

    const invoice = await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Invalid Email User",
        customerEmail: bouncedCustomerEmail,
        invoiceNumber: "INV-999",
        lineItems: "[]",
        subtotal: 12000,
        total: 12000,
        dueDate: new Date(),
        status: "SENT",
        emailDeliveryStatus: "DELIVERED",
      },
    });

    const webhookPayload = {
      type: "email.bounced",
      created_at: new Date().toISOString(),
      data: {
        to: [bouncedCustomerEmail],
        subject: "Invoice INV-999",
      },
    };

    const req = new NextRequest("http://localhost:3000/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify(webhookPayload),
      headers: { "Content-Type": "application/json" },
    });

    const res = await bounceWebhookHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.received).toBe(true);

    const updated = await prisma.invoice.findUnique({
      where: { id: invoice.id },
    });
    expect(updated?.emailDeliveryStatus).toBe("BOUNCED");

    // Verify activity log
    const log = await prisma.activityLog.findFirst({
      where: {
        invoiceId: invoice.id,
        eventType: "invoice.email_bounced",
      },
    });
    expect(log).not.toBeNull();
    expect(log?.status).toBe("FAILURE");
  });

  it("ignores non-bounce webhook events without modifying records", async () => {
    const req = new NextRequest("http://localhost:3000/api/webhooks/resend", {
      method: "POST",
      body: JSON.stringify({
        type: "email.opened",
        data: { to: ["somebody@example.com"] },
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await bounceWebhookHandler(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.ignored).toBe(true);
  });
});
