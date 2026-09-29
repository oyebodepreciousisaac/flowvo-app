import { describe, it, expect, beforeEach } from "vitest";
import {
  leadAcknowledgementHtml,
  leadAcknowledgementText,
} from "@/lib/email-templates/lead-ack";
import { prisma } from "@/lib/prisma";
import { generateSlug } from "@/lib/auth";

describe("Slice 2: Email Templates", () => {
  it("generates professional HTML acknowledgement with customer & business details", () => {
    const html = leadAcknowledgementHtml({
      firstName: "David",
      businessName: "Apex Plumbing & Heating",
      serviceType: "Boiler Installation",
    });

    expect(html).toContain("Hi David,");
    expect(html).toContain("Apex Plumbing &amp; Heating");
    expect(html).toContain("Boiler Installation");
    // Spec requirement: No Flowvo branding in email body
    expect(html).not.toContain("Flowvo");
  });

  it("generates plain-text fallback acknowledgement matching HTML details", () => {
    const text = leadAcknowledgementText({
      firstName: "Sarah",
      businessName: "Elite Electrics",
      serviceType: "Consumer Unit Upgrade",
    });

    expect(text).toContain("Hi Sarah,");
    expect(text).toContain("Elite Electrics");
    expect(text).toContain("Consumer Unit Upgrade");
    // Spec requirement: No Flowvo branding in email body
    expect(text).not.toContain("Flowvo");
  });
});

describe("Slice 2: Lead Creation and ActivityLog", () => {
  let testBusinessId: string;

  beforeEach(async () => {
    const testSlug = generateSlug(`Test Tradesman ${Math.random()}`);
    // Create test business
    const business = await prisma.business.create({
      data: {
        name: "Test Tradesman Ltd",
        slug: testSlug,
        email: `owner-${Math.random().toString(36).slice(2)}@testtrades.com`,
      },
    });
    testBusinessId = business.id;
  });

  it("creates a Lead with default NEW status and creates associated ActivityLogs", async () => {
    const lead = await prisma.lead.create({
      data: {
        businessId: testBusinessId,
        customerName: "Jane Doe",
        phone: "07700900111",
        email: "jane.doe@example.com",
        serviceType: "Emergency Leak Repair",
        description: "Water pipe leaking in kitchen under sink",
        source: "Google / Search",
        status: "NEW",
      },
    });

    expect(lead.id).toBeDefined();
    expect(lead.status).toBe("NEW");
    expect(lead.customerName).toBe("Jane Doe");

    // Create lead.created activity log
    const log1 = await prisma.activityLog.create({
      data: {
        businessId: testBusinessId,
        leadId: lead.id,
        entityType: "lead",
        entityId: lead.id,
        eventType: "lead.created",
        status: "SUCCESS",
      },
    });

    // Create ack.sent activity log
    const log2 = await prisma.activityLog.create({
      data: {
        businessId: testBusinessId,
        leadId: lead.id,
        entityType: "lead",
        entityId: lead.id,
        eventType: "ack.sent",
        status: "SUCCESS",
        detail: null,
      },
    });

    // Query lead with activity logs
    const fetchedLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: {
        activityLogs: {
          orderBy: { occurredAt: "asc" },
        },
      },
    });

    expect(fetchedLead).not.toBeNull();
    expect(fetchedLead?.activityLogs).toHaveLength(2);
    expect(fetchedLead?.activityLogs[0].eventType).toBe("lead.created");
    expect(fetchedLead?.activityLogs[1].eventType).toBe("ack.sent");
  });

  it("logs failure to ActivityLog when email fails while preserving the Lead record", async () => {
    const lead = await prisma.lead.create({
      data: {
        businessId: testBusinessId,
        customerName: "Mark Evans",
        phone: "07700900222",
        email: "mark@invalid-domain-test.com",
        serviceType: "Bathroom Refit",
        description: "Complete overhaul of master bathroom tiles and plumbing",
        status: "NEW",
      },
    });

    // Log simulated email failure
    const failedLog = await prisma.activityLog.create({
      data: {
        businessId: testBusinessId,
        leadId: lead.id,
        entityType: "lead",
        entityId: lead.id,
        eventType: "ack.failed",
        status: "FAILURE",
        detail: "Simulated SMTP / API timeout",
      },
    });

    expect(failedLog.status).toBe("FAILURE");
    expect(failedLog.eventType).toBe("ack.failed");

    // Verify lead still exists in database
    const existingLead = await prisma.lead.findUnique({
      where: { id: lead.id },
    });
    expect(existingLead).not.toBeNull();
    expect(existingLead?.customerName).toBe("Mark Evans");
  });
});
