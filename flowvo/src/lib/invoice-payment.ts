import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isValidGoogleReviewUrl } from "@/lib/review";
import { reviewRequestHtml, reviewRequestText } from "@/lib/email-templates/review-request";
import { formatAmount } from "@/lib/currency";
import { getEffectivePaystackSecretKey, initializePaystackTransaction } from "@/lib/paystack";
import { getEffectiveStripeSecretKey, createStripeCheckoutSession } from "@/lib/stripe";
import { decryptField } from "@/lib/security";

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

export async function generateInvoicePaymentLink({
  invoice,
  business,
  origin,
  callbackPath,
}: {
  invoice: {
    id: string;
    invoiceNumber: string;
    customerEmail: string;
    total: number;
    currency: string;
    paymentLinkUrl?: string | null;
    paymentReference?: string | null;
    quoteId?: string | null;
  };
  business: {
    id: string;
    currency?: string;
    paymentsEnabled?: boolean;
    paymentGateway?: string;
    paystackSecretKey?: string | null;
    paystackSubaccountCode?: string | null;
    stripeSecretKey?: string | null;
  };
  origin: string;
  callbackPath?: string;
}): Promise<{ paymentLinkUrl: string | null; paymentReference: string | null }> {
  // If payment link is already generated, return it
  if (invoice.paymentLinkUrl) {
    return {
      paymentLinkUrl: invoice.paymentLinkUrl,
      paymentReference: invoice.paymentReference || null,
    };
  }

  const currency = (invoice.currency || "NGN").toUpperCase();
  const gateway =
    business.paymentGateway ||
    (["NGN", "GHS", "ZAR", "KES"].includes(currency) ? "PAYSTACK" : "STRIPE");

  let paymentLinkUrl: string | null = null;
  let paymentReference = invoice.paymentReference || null;
  let gatewayPaymentId: string | null = null;

  if (gateway === "PAYSTACK" || (!business.paymentGateway && currency === "NGN")) {
    const customPaystackKey = business.paystackSecretKey
      ? decryptField(business.paystackSecretKey)
      : null;
    const paystackKey = getEffectivePaystackSecretKey(customPaystackKey);
    if (paystackKey) {
      try {
        const ref = paymentReference || `FLOWVO_${invoice.id}_${Date.now()}`;
        const subaccountCode = business.paystackSubaccountCode || undefined;
        const initRes = await initializePaystackTransaction({
          secretKey: paystackKey,
          email: invoice.customerEmail,
          amountInKobo: invoice.total,
          currency,
          reference: ref,
          subaccount: subaccountCode,
          callbackUrl: `${origin}${callbackPath || `/invoices/view/${invoice.id}?paid=true`}`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            businessId: business.id,
            subaccount: subaccountCode,
          },
        });

        if (initRes.status && initRes.data?.authorization_url) {
          paymentLinkUrl = initRes.data.authorization_url;
          paymentReference = ref;
        }
      } catch (err) {
        console.error("Failed to generate Paystack payment link:", err);
      }
    }
  } else if (gateway === "STRIPE") {
    const customStripeKey = business.stripeSecretKey
      ? decryptField(business.stripeSecretKey)
      : null;
    const stripeKey = getEffectiveStripeSecretKey(customStripeKey);
    if (stripeKey) {
      try {
        const sessionRes = await createStripeCheckoutSession({
          secretKey: stripeKey,
          customerEmail: invoice.customerEmail,
          amountInCents: invoice.total,
          currency,
          invoiceNumber: invoice.invoiceNumber,
          successUrl: `${origin}${callbackPath || `/invoices/view/${invoice.id}?paid=true`}&session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${origin}${callbackPath || `/invoices/view/${invoice.id}?canceled=true`}`,
          metadata: {
            invoiceId: invoice.id,
            businessId: business.id,
          },
        });

        if (sessionRes.url) {
          paymentLinkUrl = sessionRes.url;
          gatewayPaymentId = sessionRes.id || null;
        }
      } catch (err) {
        console.error("Failed to generate Stripe payment link:", err);
      }
    }
  }

  if (paymentLinkUrl) {
    try {
      await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paymentLinkUrl,
          ...(paymentReference ? { paymentReference } : {}),
          ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
        },
      });
    } catch (err) {
      console.error("Failed to save payment link on invoice:", err);
    }
  }

  return { paymentLinkUrl, paymentReference };
}

