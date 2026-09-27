import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Invoice } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const eventType = body.type || body.event;
    const isBounce =
      eventType === "email.bounced" ||
      eventType === "bounce" ||
      eventType === "bounced";

    if (!isBounce) {
      // Acknowledge other webhook events (e.g. email.delivered, email.opened) gracefully
      return NextResponse.json({ received: true, ignored: true });
    }

    // Extract recipients
    const data = body.data || body;
    let recipients: string[] = [];

    if (Array.isArray(data.to)) {
      recipients = data.to.map((e: string) => e.trim().toLowerCase());
    } else if (typeof data.to === "string") {
      recipients = [data.to.trim().toLowerCase()];
    } else if (typeof data.recipient === "string") {
      recipients = [data.recipient.trim().toLowerCase()];
    } else if (typeof body.recipient === "string") {
      recipients = [body.recipient.trim().toLowerCase()];
    }

    // Also support direct invoiceId if passed in custom tags/payload
    const invoiceId = data.invoiceId || body.invoiceId;

    let targetInvoices: Invoice[] = [];

    if (invoiceId) {
      const inv = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });
      if (inv) targetInvoices.push(inv);
    } else if (recipients.length > 0) {
      // Find the most recent invoice(s) sent to this recipient
      targetInvoices = await prisma.invoice.findMany({
        where: {
          customerEmail: {
            in: recipients,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      });
    }

    let updatedCount = 0;
    for (const inv of targetInvoices) {
      await prisma.invoice.update({
        where: { id: inv.id },
        data: {
          emailDeliveryStatus: "BOUNCED",
        },
      });

      await prisma.activityLog.create({
        data: {
          businessId: inv.businessId,
          leadId: inv.leadId,
          quoteId: inv.quoteId,
          jobId: inv.jobId,
          invoiceId: inv.id,
          entityType: "invoice",
          entityId: inv.id,
          eventType: "invoice.email_bounced",
          status: "FAILURE",
          detail: `Email delivery to ${inv.customerEmail} bounced according to mail server webhook`,
        },
      });

      updatedCount++;
    }

    return NextResponse.json({
      received: true,
      updatedCount,
      matchedInvoices: targetInvoices.map((i) => i.id),
    });
  } catch (error) {
    console.error("Resend webhook error:", error);
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}
