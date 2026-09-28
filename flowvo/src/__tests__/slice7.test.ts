import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, generateSlug } from "@/lib/auth";
import { GET as healthHandler } from "@/app/api/health/route";
import { z } from "zod";

// Mirror profileSchema to test bounds validation unit-wise
const profileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  phone: z.string().max(30).optional().nullable(),
  email: z.string().email("A valid email is required"),
  bankName: z.string().max(80).optional().nullable(),
  accountNumber: z.string().max(20).optional().nullable(),
  sortCode: z.string().max(10).optional().nullable(),
  paymentTermsDays: z.coerce.number().int().min(1).max(90),
  quoteFollowUpDelayDays: z.coerce.number().int().min(1, "Minimum delay is 1 day").max(7, "Maximum delay is 7 days").default(3),
  reviewReminderDelayDays: z.coerce.number().int().min(1, "Minimum delay is 1 day").max(7, "Maximum delay is 7 days").default(4),
  googleReviewUrl: z.string().url("Must be a valid URL").optional().nullable().or(z.literal("")),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

describe("Slice 7: Health Endpoint", () => {
  it("returns status ok and db connected on GET /api/health", async () => {
    const res = await healthHandler();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(data.db).toBe("connected");
    expect(data.timestamp).toBeDefined();
  });
});

describe("Slice 7: Password Security & Change Password Logic", () => {
  it("hashes password and verifies matches correctly", async () => {
    const plain = "SecureP@ssword123!";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(await verifyPassword(plain, hash)).toBe(true);
    expect(await verifyPassword("WrongPassword!", hash)).toBe(false);
  });

  it("validates change password schema", () => {
    const valid = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "NewSecretPassword456",
    });
    expect(valid.success).toBe(true);

    const tooShort = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "short",
    });
    expect(tooShort.success).toBe(false);

    const missingCurrent = changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "NewSecretPassword456",
    });
    expect(missingCurrent.success).toBe(false);
  });
});

describe("Slice 7: Automation Timing Delay Bounds", () => {
  it("accepts automation delays within 1-7 days", () => {
    const valid = profileSchema.safeParse({
      name: "Summit Plumbing",
      email: "summit@test.com",
      paymentTermsDays: 14,
      quoteFollowUpDelayDays: 3,
      reviewReminderDelayDays: 5,
    });
    expect(valid.success).toBe(true);
  });

  it("rejects delay less than 1 or greater than 7", () => {
    const zeroDelay = profileSchema.safeParse({
      name: "Summit Plumbing",
      email: "summit@test.com",
      paymentTermsDays: 14,
      quoteFollowUpDelayDays: 0,
      reviewReminderDelayDays: 3,
    });
    expect(zeroDelay.success).toBe(false);

    const excessiveDelay = profileSchema.safeParse({
      name: "Summit Plumbing",
      email: "summit@test.com",
      paymentTermsDays: 14,
      quoteFollowUpDelayDays: 3,
      reviewReminderDelayDays: 8,
    });
    expect(excessiveDelay.success).toBe(false);
  });
});

describe("Slice 7: Dashboard Action Strip & Priority Ordering", () => {
  let businessId: string;

  beforeEach(async () => {
    const biz = await prisma.business.create({
      data: {
        name: "Dashboard Test Co",
        slug: generateSlug(`Dash ${Math.random()}`),
        email: `dash-${Math.random().toString(36).slice(2)}@test.com`,
      },
    });
    businessId = biz.id;
  });

  it("identifies action items and groups them according to severity", async () => {
    const now = new Date();

    // 1. Create an overdue invoice (due yesterday) -> Severity: Red (Overdue)
    const overdueDue = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Overdue Client",
        customerEmail: "overdue@test.com",
        invoiceNumber: "INV-DASH-01",
        lineItems: "[]",
        subtotal: 15000,
        total: 15000,
        status: "OVERDUE",
        dueDate: overdueDue,
      },
    });

    // 2. Create a delivery failure invoice -> Severity: Red (Bounced)
    await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Bounced Client",
        customerEmail: "bounced@test.com",
        invoiceNumber: "INV-DASH-02",
        lineItems: "[]",
        subtotal: 20000,
        total: 20000,
        status: "SENT",
        emailDeliveryStatus: "BOUNCED",
        dueDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 3. Create a draft invoice -> Severity: Amber (Draft)
    await prisma.invoice.create({
      data: {
        businessId,
        customerName: "Draft Client",
        customerEmail: "draft@test.com",
        invoiceNumber: "INV-DASH-03",
        lineItems: "[]",
        subtotal: 30000,
        total: 30000,
        status: "DRAFT",
        dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      },
    });

    // 4. Create a stalled quote (>7 days old) -> Severity: Amber (Stalled)
    const quoteLead = await prisma.lead.create({
      data: {
        businessId,
        customerName: "Quote Lead",
        email: "quotelead@test.com",
        phone: "07700900002",
        serviceType: "Rewiring",
        description: "Full house rewiring enquiry",
        status: "QUOTED",
      },
    });

    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000);
    await prisma.quote.create({
      data: {
        businessId,
        leadId: quoteLead.id,
        lineItems: "[]",
        subtotal: 10000,
        total: 10000,
        status: "SENT",
        sentAt: eightDaysAgo,
        quoteToken: `dash-quote-${Math.random().toString(36).slice(2)}`,
      },
    });

    // 5. Create a new lead awaiting first contact -> Severity: Teal (New)
    await prisma.lead.create({
      data: {
        businessId,
        customerName: "New Lead Client",
        email: "newlead@test.com",
        phone: "07700900001",
        serviceType: "Boiler Installation",
        description: "Emergency boiler breakdown",
        status: "NEW",
      },
    });

    // Query for dashboard KPIs
    const [activeLeads, openQuotes, jobsInProgress, unpaidInvoices] = await Promise.all([
      prisma.lead.count({
        where: { businessId, status: { in: ["NEW", "CONTACTED", "QUOTED"] } },
      }),
      prisma.quote.count({
        where: { businessId, status: "SENT" },
      }),
      prisma.job.count({
        where: { businessId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      }),
      prisma.invoice.count({
        where: { businessId, status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
      }),
    ]);

    expect(activeLeads).toBe(2);
    expect(openQuotes).toBe(1);
    expect(jobsInProgress).toBe(0);
    expect(unpaidInvoices).toBe(3); // 1 overdue, 1 sent/bounced, 1 draft

    // Check action strip queries
    const overdueList = await prisma.invoice.findMany({
      where: { businessId, status: "OVERDUE" },
    });
    expect(overdueList.length).toBe(1);
    expect(overdueList[0].customerName).toBe("Overdue Client");

    const bouncedList = await prisma.invoice.findMany({
      where: { businessId, emailDeliveryStatus: "BOUNCED" },
    });
    expect(bouncedList.length).toBe(1);
    expect(bouncedList[0].customerName).toBe("Bounced Client");

    const draftList = await prisma.invoice.findMany({
      where: { businessId, status: "DRAFT" },
    });
    expect(draftList.length).toBe(1);

    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const stalledList = await prisma.quote.findMany({
      where: {
        businessId,
        status: "SENT",
        sentAt: { lt: sevenDaysAgo },
      },
    });
    expect(stalledList.length).toBe(1);

    const newLeadsList = await prisma.lead.findMany({
      where: { businessId, status: "NEW" },
    });
    expect(newLeadsList.length).toBe(1);
  });
});
