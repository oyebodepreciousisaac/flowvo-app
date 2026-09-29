import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNextInvoiceNumber } from "@/lib/invoice";
import { isSameOrigin } from "@/lib/security";
import { formatAmount } from "@/lib/currency";

const updateJobSchema = z.object({
  status: z.enum(["SCHEDULED", "IN_PROGRESS", "COMPLETE"]).optional(),
  scheduledDate: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      invoices: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = updateJobSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { status, scheduledDate } = result.data;
  const updateData: {
    status?: string;
    completedAt?: Date | null;
    scheduledDate?: Date | null;
  } = {};

  // Status transition validation
  if (status && status !== job.status) {
    // If job is already COMPLETE, cannot revert
    if (job.status === "COMPLETE") {
      return NextResponse.json(
        { error: "Cannot change the status of an already completed job." },
        { status: 422 }
      );
    }

    // Allowed transitions: SCHEDULED -> IN_PROGRESS, SCHEDULED -> COMPLETE, IN_PROGRESS -> COMPLETE
    if (
      (job.status === "SCHEDULED" && (status === "IN_PROGRESS" || status === "COMPLETE")) ||
      (job.status === "IN_PROGRESS" && status === "COMPLETE")
    ) {
      updateData.status = status;
      if (status === "COMPLETE") {
        updateData.completedAt = new Date();
      }
    } else {
      return NextResponse.json(
        { error: `Invalid status transition from ${job.status} to ${status}.` },
        { status: 422 }
      );
    }
  }

  // Update scheduledDate
  if (scheduledDate !== undefined) {
    updateData.scheduledDate = scheduledDate ? new Date(scheduledDate) : null;
  }

  // Execute job update
  const updatedJob = await prisma.job.update({
    where: { id: job.id },
    data: updateData,
  });

  // Handle side-effects of COMPLETE: Auto-draft Invoice
  let invoice = job.invoices[0];
  if (status === "COMPLETE" && !invoice) {
    const invoiceNumber = await getNextInvoiceNumber(session.user.businessId);
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Net 30

    const invoiceCurrency = (job.currency || "NGN").toUpperCase();

    invoice = await prisma.invoice.create({
      data: {
        jobId: job.id,
        quoteId: job.quoteId,
        leadId: job.leadId,
        businessId: session.user.businessId,
        customerName: job.customerName,
        customerEmail: job.customerEmail,
        invoiceNumber,
        lineItems: job.lineItems || "[]",
        subtotal: job.amount,
        total: job.amount,
        currency: invoiceCurrency,
        status: "DRAFT",
        dueDate,
      },
    });

    // Log invoice auto-drafted
    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: job.leadId,
        quoteId: job.quoteId,
        jobId: job.id,
        invoiceId: invoice.id,
        entityType: "invoice",
        entityId: invoice.id,
        eventType: "invoice.drafted",
        status: "SUCCESS",
        detail: `Invoice ${invoiceNumber} automatically drafted (${formatAmount(job.amount, invoiceCurrency)})`,
      },
    });

    // Log job marked complete
    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: job.leadId,
        quoteId: job.quoteId,
        jobId: job.id,
        entityType: "job",
        entityId: job.id,
        eventType: "job.status_complete",
        status: "SUCCESS",
        detail: `Job marked complete by owner. Invoice ${invoiceNumber} drafted.`,
      },
    });
  } else if (status === "IN_PROGRESS") {
    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: job.leadId,
        quoteId: job.quoteId,
        jobId: job.id,
        entityType: "job",
        entityId: job.id,
        eventType: "job.status_in_progress",
        status: "SUCCESS",
        detail: "Job marked as in progress",
      },
    });
  }

  if (scheduledDate !== undefined && scheduledDate !== (job.scheduledDate?.toISOString() ?? null)) {
    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: job.leadId,
        quoteId: job.quoteId,
        jobId: job.id,
        entityType: "job",
        entityId: job.id,
        eventType: "job.rescheduled",
        status: "SUCCESS",
        detail: scheduledDate
          ? `Job scheduled for ${new Date(scheduledDate).toLocaleDateString("en-GB")}`
          : "Job scheduled date cleared",
      },
    });
  }

  return NextResponse.json({ ok: true, job: updatedJob, invoice });
}
