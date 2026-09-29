import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isSameOrigin, decryptField } from "@/lib/security";
import { invoiceEmailHtml, invoiceEmailText } from "@/lib/email-templates/invoice-email";
import { LineItem } from "@/lib/email-templates/quote-email";
import { formatAmount } from "@/lib/currency";
import { initializePaystackTransaction, getEffectivePaystackSecretKey } from "@/lib/paystack";
import { createStripeCheckoutSession, getEffectiveStripeSecretKey } from "@/lib/stripe";

export async function POST(
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

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      business: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const currency = (invoice.currency || invoice.business.currency || "NGN").toUpperCase();
  const origin = request.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";

  let paymentLinkUrl = invoice.paymentLinkUrl;
  let paymentReference = invoice.paymentReference;
  let gatewayPaymentId = invoice.gatewayPaymentId;

  // If online payments are enabled for this business, generate payment link if not already generated
  if (invoice.business.paymentsEnabled && !paymentLinkUrl) {
    const gateway = invoice.business.paymentGateway || "PAYSTACK";

    if (gateway === "PAYSTACK") {
      const paystackKey = getEffectivePaystackSecretKey(decryptField(invoice.business.paystackSecretKey));
      if (paystackKey) {
        try {
          const ref = paymentReference || `FLOWVO_${invoice.id}_${Date.now()}`;
          const subaccountCode = invoice.business.paystackSubaccountCode || undefined;
          const initRes = await initializePaystackTransaction({
            secretKey: paystackKey,
            email: invoice.customerEmail,
            amountInKobo: invoice.total,
            currency,
            reference: ref,
            subaccount: subaccountCode,
            callbackUrl: `${origin}/invoices/view/${invoice.id}?paid=true`,
            metadata: {
              invoiceId: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              businessId: invoice.businessId,
              subaccount: subaccountCode,
            },
          });

          if (initRes.status && initRes.data?.authorization_url) {
            paymentLinkUrl = initRes.data.authorization_url;
            paymentReference = ref;
          }
        } catch (err) {
          console.error("Failed to generate Paystack link:", err);
        }
      }
    } else if (gateway === "STRIPE") {
      const stripeKey = getEffectiveStripeSecretKey(decryptField(invoice.business.stripeSecretKey));
      if (stripeKey) {
        try {
          const sessionRes = await createStripeCheckoutSession({
            secretKey: stripeKey,
            customerEmail: invoice.customerEmail,
            amountInCents: invoice.total,
            currency,
            invoiceNumber: invoice.invoiceNumber,
            successUrl: `${origin}/invoices/view/${invoice.id}?paid=true&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl: `${origin}/invoices/view/${invoice.id}?canceled=true`,
            metadata: {
              invoiceId: invoice.id,
              businessId: invoice.businessId,
            },
          });

          if (sessionRes.url) {
            paymentLinkUrl = sessionRes.url;
            gatewayPaymentId = sessionRes.id || null;
          }
        } catch (err) {
          console.error("Failed to generate Stripe link:", err);
        }
      }
    }
  }

  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(invoice.lineItems);
  } catch {
    lineItems = [];
  }

  const formattedTotal = formatAmount(invoice.total, currency);
  const viewInvoiceUrl = `${origin}/invoices/view/${invoice.id}`;

  // Send email
  const emailRes = await sendEmail({
    to: invoice.customerEmail,
    replyTo: invoice.business.email,
    fromName: invoice.business.name,
    subject: `Invoice ${invoice.invoiceNumber} from ${invoice.business.name} — ${formattedTotal}`,
    html: invoiceEmailHtml({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      lineItems,
      totalPence: invoice.total,
      dueDate: invoice.dueDate,
      paymentDetails: decryptField(invoice.business.paymentDetails),
      currency,
      paymentLinkUrl,
      viewInvoiceUrl,
    }),
    text: invoiceEmailText({
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      businessName: invoice.business.name,
      lineItems,
      totalPence: invoice.total,
      dueDate: invoice.dueDate,
      paymentDetails: decryptField(invoice.business.paymentDetails),
      currency,
      paymentLinkUrl,
      viewInvoiceUrl,
    }),
  });

  // Update status and payment links in DB
  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
      emailDeliveryStatus: emailRes.success ? "DELIVERED" : "PENDING",
      currency,
      ...(paymentLinkUrl ? { paymentLinkUrl } : {}),
      ...(paymentReference ? { paymentReference } : {}),
      ...(gatewayPaymentId ? { gatewayPaymentId } : {}),
    },
  });

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
      eventType: emailRes.success ? "invoice.sent" : "invoice.send_failed",
      status: emailRes.success ? "SUCCESS" : "FAILURE",
      detail: emailRes.success
        ? `Invoice ${invoice.invoiceNumber} sent to ${invoice.customerEmail} (${formattedTotal})${paymentLinkUrl ? " with online payment link" : ""}`
        : `Email delivery failed: ${emailRes.error}`,
    },
  });

  return NextResponse.json({ ok: true, invoice: updatedInvoice });
}
