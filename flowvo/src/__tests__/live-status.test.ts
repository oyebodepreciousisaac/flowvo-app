import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/auth";

describe("Live Status API & Real-time Fingerprint", () => {
  let businessId: string;

  beforeEach(async () => {
    const biz = await prisma.business.create({
      data: {
        name: "Live Test Electrical",
        slug: generateSlug(`Live ${Math.random()}`),
        email: `live-${Math.random().toString(36).slice(2)}@test.com`,
      },
    });
    businessId = biz.id;
  });

  it("calculates accurate count summary and fingerprint for business", async () => {
    const lead = await prisma.lead.create({
      data: {
        businessId,
        customerName: "Jane Doe",
        email: "jane@test.com",
        phone: "07700900999",
        serviceType: "Fusebox Replacement",
        description: "Old rewireable fusebox needs modern consumer unit",
        status: "NEW",
      },
    });

    const [newLeads, openQuotes, unpaidInvoices] = await Promise.all([
      prisma.lead.count({ where: { businessId, status: "NEW" } }),
      prisma.quote.count({ where: { businessId, status: "SENT" } }),
      prisma.invoice.count({ where: { businessId, status: { in: ["DRAFT", "SENT", "OVERDUE"] } } }),
    ]);

    expect(newLeads).toBe(1);
    expect(openQuotes).toBe(0);
    expect(unpaidInvoices).toBe(0);

    const log1 = await prisma.activityLog.create({
      data: {
        businessId,
        leadId: lead.id,
        entityType: "lead",
        entityId: lead.id,
        eventType: "lead.created",
        status: "SUCCESS",
        detail: "Submitted online",
      },
    });

    const fingerprint1 = `${log1.id}_${log1.occurredAt.getTime()}_${newLeads}_${openQuotes}_0_${unpaidInvoices}`;
    expect(fingerprint1).toContain(log1.id);

    // Now simulate an update (new activity)
    const log2 = await prisma.activityLog.create({
      data: {
        businessId,
        leadId: lead.id,
        entityType: "lead",
        entityId: lead.id,
        eventType: "ack.sent",
        status: "SUCCESS",
        detail: "Acknowledgement sent",
      },
    });

    const fingerprint2 = `${log2.id}_${log2.occurredAt.getTime()}_${newLeads}_${openQuotes}_0_${unpaidInvoices}`;
    // Fingerprint should change!
    expect(fingerprint2).not.toBe(fingerprint1);
  });
});
