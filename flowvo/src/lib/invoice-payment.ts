import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isValidGoogleReviewUrl } from "@/lib/review";
import { reviewRequestHtml, reviewRequestText } from "@/lib/email-templates/review-request";
import { formatAmount } from "@/lib/currency";

export async function processInvoicePaymentSuccess({
  invoiceId,
  gatewayPaymentId,
  paymentReference,
  origin = "http://localhost:3000",
}: {
  invoiceId: string;
  gatewayPaymentId?: string;
  paymentReference?: string;
  origin?: string;
}) {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      business: true,
      job: true,
      lead: true,
      reviewRequests: true,
    },
  });

  if (!invoice) {
    throw new Error(`Invoice ${invoiceId} not found`);
  }

  // Idempotency: if already PAID, do not double-process
  if (invoice.status === "PAID") {
    return { ok: true, alreadyPaid: true, invoice };
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "PAID",
      paidAt: invoice.paidAt || new Date(),
      ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
      ...(paymentReference ? { paymentReference } : {}),
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: invoice.businessId,
      leadId: invoice.leadId,
      quoteId: invoice.quoteId,
      jobId: invoice.jobId,
      invoiceId: invoice.id,
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "invoice.paid",
      status: "SUCCESS",
      detail: `Invoice ${invoice.invoiceNumber} marked as paid (${formatAmount(invoice.total, invoice.currency)})`,
    },
  });

  // Review request trigger (Slice 6)
  let reviewRequest = invoice.reviewRequests[0];

  const priorUnsubscribe = await prisma.reviewRequest.findFirst({
    where: {
      businessId: invoice.businessId,
      customerEmail: invoice.customerEmail.toLowerCase().trim(),
      unsubscribedAt: { not: null },
    },
  });

  if (priorUnsubscribe) {
    if (!reviewRequest) {
      reviewRequest = await prisma.reviewRequest.create({
        data: {
          invoiceId: invoice.id,
          jobId: invoice.jobId,
          businessId: invoice.businessId,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail.toLowerCase().trim(),
          status: "PENDING",
          unsubscribedAt: priorUnsubscribe.unsubscribedAt,
          unsubscribeToken: crypto.randomBytes(16).toString("hex"),
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        businessId: invoice.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.blocked_unsubscribed",
        status: "FAILURE",
        detail: `Review request blocked: customer ${invoice.customerEmail} has previously unsubscribed`,
      },
    });

    return { ok: true, invoice: updatedInvoice };
  }

  if (!invoice.business.googleReviewUrl || !isValidGoogleReviewUrl(invoice.business.googleReviewUrl)) {
    if (!reviewRequest) {
      reviewRequest = await prisma.reviewRequest.create({
        data: {
          invoiceId: invoice.id,
          jobId: invoice.jobId,
          businessId: invoice.businessId,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail.toLowerCase().trim(),
          status: "PENDING",
          unsubscribeToken: crypto.randomBytes(16).toString("hex"),
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        businessId: invoice.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.blocked_missing_url",
        status: "FAILURE",
        detail: "Review request not sent: Google review URL is missing or invalid in Settings",
      },
    });

    return { ok: true, invoice: updatedInvoice };
  }

  // Eligible to send review request
  const unsubscribeToken = crypto.randomBytes(16).toString("hex");
  if (!reviewRequest) {
    reviewRequest = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        jobId: invoice.jobId,
        businessId: invoice.businessId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail.toLowerCase().trim(),
        status: "PENDING",
        unsubscribeToken,
      },
    });
  }

  const unsubscribeUrl = `${origin}/unsubscribe/${reviewRequest.unsubscribeToken}`;

  const emailRes = await sendEmail({
    to: invoice.customerEmail,
    replyTo: invoice.business.email,
    fromName: invoice.business.name,
    subject: `How did we do? — ${invoice.business.name}`,
    html: reviewRequestHtml({
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      serviceType: invoice.job?.description ?? null,
      googleReviewUrl: invoice.business.googleReviewUrl,
      unsubscribeUrl,
    }),
    text: reviewRequestText({
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      serviceType: invoice.job?.description ?? null,
      googleReviewUrl: invoice.business.googleReviewUrl,
      unsubscribeUrl,
    }),
  });

  if (emailRes.success) {
    await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: {
        status: "SENT",
        sentAt: new Date(),
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: invoice.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.sent",
        status: "SUCCESS",
        detail: `Review request sent to ${invoice.customerEmail}`,
      },
    });
  } else {
    await prisma.activityLog.create({
      data: {
        businessId: invoice.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.failed",
        status: "FAILURE",
        detail: `Failed to send review request: ${emailRes.error}`,
      },
    });
  }

  return { ok: true, invoice: updatedInvoice };
}
