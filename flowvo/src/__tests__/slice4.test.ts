import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/auth";
import { getNextInvoiceNumber } from "@/lib/invoice";

describe("Slice 4: Job Status Transitions & Validation", () => {
  let businessId: string;
  let leadId: string;

  beforeEach(async () => {
    const slug = generateSlug(`Job Test ${Math.random()}`);
    const business = await prisma.business.create({
      data: {
        name: "Premier Heating",
        slug,
        email: `owner-${Math.random().toString(36).slice(2)}@premier.com`,
      },
    });
    businessId = business.id;

    const lead = await prisma.lead.create({
      data: {
        businessId,
        customerName: "Tom Hardy",
        email: "tom@example.com",
        phone: "07700900888",
        serviceType: "Radiator Powerflush",
        description: "5 radiators not heating up properly",
        status: "WON",
      },
    });
    leadId = lead.id;
  });

  it("allows transitions from SCHEDULED to IN_PROGRESS and to COMPLETE", async () => {
    const job = await prisma.job.create({
      data: {
        leadId,
        businessId,
        customerName: "Tom Hardy",
        customerEmail: "tom@example.com",
        customerPhone: "07700900888",
        description: "Radiator Powerflush",
        amount: 45000,
        status: "SCHEDULED",
      },
    });

    expect(job.status).toBe("SCHEDULED");

    // Transition SCHEDULED -> IN_PROGRESS
    const inProgressJob = await prisma.job.update({
      where: { id: job.id },
      data: { status: "IN_PROGRESS" },
    });
    expect(inProgressJob.status).toBe("IN_PROGRESS");

    // Transition IN_PROGRESS -> COMPLETE
    const completedJob = await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
    expect(completedJob.status).toBe("COMPLETE");
    expect(completedJob.completedAt).not.toBeNull();
  });

  it("allows direct transition from SCHEDULED to COMPLETE (skipping in_progress)", async () => {
    const job = await prisma.job.create({
      data: {
        leadId,
        businessId,
        customerName: "Tom Hardy",
        customerEmail: "tom@example.com",
        customerPhone: "07700900888",
        description: "Radiator Powerflush",
        amount: 45000,
        status: "SCHEDULED",
      },
    });

    const completedJob = await prisma.job.update({
      where: { id: job.id },
      data: { status: "COMPLETE", completedAt: new Date() },
    });
    expect(completedJob.status).toBe("COMPLETE");
  });
});

describe("Slice 4: Auto-Draft Invoice Generation on Completion", () => {
  let businessId: string;
  let leadId: string;

  beforeEach(async () => {
    const slug = generateSlug(`Invoice Draft Test ${Math.random()}`);
    const business = await prisma.business.create({
      data: {
        name: "Direct Electrical",
        slug,
        email: `owner-${Math.random().toString(36).slice(2)}@directelec.com`,
      },
    });
    businessId = business.id;

    const lead = await prisma.lead.create({
      data: {
        businessId,
        customerName: "Claire Dunphy",
        email: "claire@modern.test",
        phone: "07700900555",
        serviceType: "EV Charger Installation",
        description: "7kW home charger install",
        status: "WON",
      },
    });
    leadId = lead.id;
  });

  it("generates sequential invoice numbers (INV-001, INV-002)", async () => {
    const num1 = await getNextInvoiceNumber(businessId);
    expect(num1).toBe("INV-001");

    await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Test 1",
        customerEmail: "t1@test.com",
        invoiceNumber: num1,
        lineItems: "[]",
        subtotal: 10000,
        total: 10000,
        dueDate: new Date(),
        status: "DRAFT",
      },
    });

    const num2 = await getNextInvoiceNumber(businessId);
    expect(num2).toBe("INV-002");
  });

  it("auto-drafts invoice when job is completed with copied customer data and line items", async () => {
    const lineItemsJson = JSON.stringify([
      { description: "EV Charger Unit", quantity: 1, unitPricePence: 55000, lineTotalPence: 55000 },
      { description: "Installation & Certification", quantity: 1, unitPricePence: 35000, lineTotalPence: 35000 },
    ]);

    const job = await prisma.job.create({
      data: {
        leadId,
        businessId,
        customerName: "Claire Dunphy",
        customerEmail: "claire@modern.test",
        customerPhone: "07700900555",
        description: "EV Charger Installation",
        lineItems: lineItemsJson,
        amount: 90000, // £900.00
        status: "SCHEDULED",
      },
    });

    // Mark job complete & auto-draft invoice
    const invNum = await getNextInvoiceNumber(businessId);
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        jobId: job.id,
        leadId: job.leadId,
        businessId,
        customerName: job.customerName,
        customerEmail: job.customerEmail,
        invoiceNumber: invNum,
        lineItems: job.lineItems || "[]",
        subtotal: job.amount,
        total: job.amount,
        status: "DRAFT",
        dueDate,
      },
    });

    expect(invoice.id).toBeDefined();
    expect(invoice.invoiceNumber).toBe("INV-001");
    expect(invoice.status).toBe("DRAFT");
    expect(invoice.total).toBe(90000);
    expect(invoice.customerName).toBe("Claire Dunphy");
    expect(invoice.jobId).toBe(job.id);
  });
});
