import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      reviewRequests: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Update status to PAID
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: invoice.paidAt || new Date(),
    },
  });

  // Trigger Review Request creation (Slice 6 requirement)
  let reviewRequest = invoice.reviewRequests[0];
  if (!reviewRequest) {
    const unsubscribeToken = crypto.randomBytes(16).toString("hex");

    reviewRequest = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        jobId: invoice.jobId,
        businessId: session.user.businessId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail,
        status: "PENDING",
        unsubscribeToken,
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.triggered",
        status: "SUCCESS",
        detail: `Review request queued for ${invoice.customerName}`,
      },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: session.user.businessId,
      leadId: invoice.leadId,
      quoteId: invoice.quoteId,
      jobId: invoice.jobId,
      invoiceId: invoice.id,
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "invoice.paid",
      status: "SUCCESS",
      detail: `Invoice ${invoice.invoiceNumber} marked as paid (£${(invoice.total / 100).toFixed(2)})`,
    },
  });

  return NextResponse.json({ ok: true, invoice: updatedInvoice, reviewRequest });
}
