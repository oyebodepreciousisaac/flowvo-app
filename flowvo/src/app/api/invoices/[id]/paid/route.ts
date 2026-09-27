import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isValidGoogleReviewUrl } from "@/lib/review";
import { reviewRequestHtml, reviewRequestText } from "@/lib/email-templates/review-request";

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
      business: true,
      job: true,
      lead: true,
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

  // Log invoice paid activity
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

  // Trigger Review Request workflow (Slice 6)
  let reviewRequest = invoice.reviewRequests[0];
  const origin = request.nextUrl.origin || "http://localhost:3000";

  // Check if customer previously unsubscribed from review requests for this business
  const priorUnsubscribe = await prisma.reviewRequest.findFirst({
    where: {
      businessId: session.user.businessId,
      customerEmail: invoice.customerEmail.toLowerCase().trim(),
      unsubscribedAt: { not: null },
    },
  });

  if (priorUnsubscribe) {
    // Blocked by customer preference (PECR compliance)
    if (!reviewRequest) {
      reviewRequest = await prisma.reviewRequest.create({
        data: {
          invoiceId: invoice.id,
          jobId: invoice.jobId,
          businessId: session.user.businessId,
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
        businessId: session.user.businessId,
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

    return NextResponse.json({
      ok: true,
      invoice: updatedInvoice,
      reviewRequest,
      reviewStatus: "blocked_unsubscribed",
    });
  }

  // Guard: googleReviewUrl must be set and valid
  const hasValidReviewUrl = isValidGoogleReviewUrl(invoice.business.googleReviewUrl);

  if (!hasValidReviewUrl) {
    // Blocked due to missing / invalid Google review link
    if (!reviewRequest) {
      reviewRequest = await prisma.reviewRequest.create({
        data: {
          invoiceId: invoice.id,
          jobId: invoice.jobId,
          businessId: session.user.businessId,
          customerName: invoice.customerName,
          customerEmail: invoice.customerEmail.toLowerCase().trim(),
          status: "PENDING",
          unsubscribeToken: crypto.randomBytes(16).toString("hex"),
        },
      });
    }

    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "review",
        entityId: reviewRequest.id,
        eventType: "review.blocked_missing_url",
        status: "FAILURE",
        detail: `Review request blocked: Google review link is not configured in Business Settings`,
      },
    });

    return NextResponse.json({
      ok: true,
      invoice: updatedInvoice,
      reviewRequest,
      reviewStatus: "blocked_missing_url",
    });
  }

  // Success: Customer is eligible and review URL is configured
  const unsubscribeToken =
    reviewRequest?.unsubscribeToken || crypto.randomBytes(16).toString("hex");
  const unsubscribeUrl = `${origin}/unsubscribe/${unsubscribeToken}`;
  const serviceType = invoice.lead?.serviceType || invoice.job?.description || "recent work";

  const emailRes = await sendEmail({
    to: invoice.customerEmail,
    replyTo: invoice.business.email,
    fromName: invoice.business.name,
    subject: `How did we do? — ${invoice.business.name}`,
    html: reviewRequestHtml({
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      serviceType,
      googleReviewUrl: invoice.business.googleReviewUrl!,
      unsubscribeUrl,
    }),
    text: reviewRequestText({
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      serviceType,
      googleReviewUrl: invoice.business.googleReviewUrl!,
      unsubscribeUrl,
    }),
  });

  const now = new Date();

  if (reviewRequest) {
    reviewRequest = await prisma.reviewRequest.update({
      where: { id: reviewRequest.id },
      data: {
        status: "SENT",
        sentAt: now,
      },
    });
  } else {
    reviewRequest = await prisma.reviewRequest.create({
      data: {
        invoiceId: invoice.id,
        jobId: invoice.jobId,
        businessId: session.user.businessId,
        customerName: invoice.customerName,
        customerEmail: invoice.customerEmail.toLowerCase().trim(),
        status: "SENT",
        sentAt: now,
        unsubscribeToken,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      businessId: session.user.businessId,
      leadId: invoice.leadId,
      quoteId: invoice.quoteId,
      jobId: invoice.jobId,
      invoiceId: invoice.id,
      entityType: "review",
      entityId: reviewRequest.id,
      eventType: emailRes.success ? "review.sent" : "review.send_failed",
      status: emailRes.success ? "SUCCESS" : "FAILURE",
      detail: emailRes.success
        ? `Automated Google review request sent to ${invoice.customerEmail}`
        : `Email delivery failed: ${emailRes.error}`,
    },
  });

  return NextResponse.json({
    ok: true,
    invoice: updatedInvoice,
    reviewRequest,
    reviewStatus: emailRes.success ? "sent" : "send_failed",
  });
}
