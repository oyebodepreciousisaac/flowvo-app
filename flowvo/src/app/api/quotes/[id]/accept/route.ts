import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/currency";
import { getNextInvoiceNumber } from "@/lib/invoice";
import { generateInvoicePaymentLink } from "@/lib/invoice-payment";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tokenOrId } = await context.params;
  const origin = request.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";

  // 1. Try finding by quoteToken (public customer accept)
  let quote = await prisma.quote.findUnique({
    where: { quoteToken: tokenOrId },
    include: {
      lead: true,
      business: true,
      jobs: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // 2. If not found by token, try finding by quote ID (requires owner session)
  if (!quote) {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Quote not found or unauthorized" }, { status: 404 });
    }
    quote = await prisma.quote.findFirst({
      where: {
        id: tokenOrId,
        businessId: session.user.businessId,
      },
      include: {
        lead: true,
        business: true,
        jobs: true,
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });
  }

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  const quoteCurrency = (quote.currency || quote.business.currency || "NGN").toUpperCase();

  // Helper to parse bank details from business
  function getEffectiveBankDetails() {
    let bName = quote?.business.bankName || "Official Settlement Bank";
    let bAcc = quote?.business.bankAccountNumber || "";
    let bAccName = quote?.business.bankAccountName || quote?.business.name;
    let bNotes = "";

    if (quote?.business.paymentDetails && quote.business.paymentDetails.startsWith("{")) {
      try {
        const parsed = JSON.parse(quote.business.paymentDetails);
        bName = parsed.bankName || bName;
        bAcc = parsed.accountNumber || bAcc;
        bAccName = parsed.accountName || bAccName;
        bNotes = parsed.notes || "";
      } catch {
        // ignore
      }
    } else if (quote?.business.paymentDetails) {
      bNotes = quote.business.paymentDetails;
    }

    return {
      bankName: bName,
      bankAccountNumber: bAcc,
      bankAccountName: bAccName,
      paymentNotes: bNotes,
      businessPhone: quote?.business.notificationPhone || quote?.business.phone || null,
      businessName: quote?.business.name || "",
    };
  }

  // If already accepted, return existing invoice and payment link info
  if (quote.status === "ACCEPTED") {
    let invoice = quote.invoices[0];
    if (invoice) {
      if (!invoice.paymentLinkUrl) {
        const linkRes = await generateInvoicePaymentLink({
          invoice,
          business: quote.business,
          origin,
          callbackPath: `/q/${quote.quoteToken}?paid=true`,
        });
        if (linkRes.paymentLinkUrl) {
          invoice.paymentLinkUrl = linkRes.paymentLinkUrl;
        }
      }
    }

    const bank = getEffectiveBankDetails();

    return NextResponse.json({
      ok: true,
      message: "Quote is already accepted",
      quote,
      invoice,
      payment: {
        invoiceId: invoice?.id,
        invoiceNumber: invoice?.invoiceNumber,
        status: invoice?.status || "SENT",
        paymentLinkUrl: invoice?.paymentLinkUrl || null,
        total: quote.total,
        currency: quoteCurrency,
        totalFormatted: formatAmount(quote.total, quoteCurrency),
        ...bank,
      },
    });
  }

  // Update Quote status
  const updatedQuote = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "ACCEPTED",
      acceptedAt: quote.acceptedAt || new Date(),
    },
  });

  // Update Lead to WON
  await prisma.lead.update({
    where: { id: quote.leadId },
    data: { status: "WON" },
  });

  // Create Job if not already created
  let job = quote.jobs[0];
  if (!job) {
    job = await prisma.job.create({
      data: {
        quoteId: quote.id,
        leadId: quote.leadId,
        businessId: quote.businessId,
        customerName: quote.lead.customerName,
        customerEmail: quote.lead.email,
        customerPhone: quote.lead.phone,
        description: quote.lead.serviceType,
        lineItems: quote.lineItems,
        amount: quote.total,
        currency: quoteCurrency,
        status: "SCHEDULED",
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: quote.businessId,
        leadId: quote.leadId,
        quoteId: quote.id,
        jobId: job.id,
        entityType: "job",
        entityId: job.id,
        eventType: "job.created",
        status: "SUCCESS",
        detail: `Job auto-created from accepted quote (${formatAmount(quote.total, quoteCurrency)})`,
      },
    });
  }

  // Find or auto-create Invoice so customer can pay immediately
  let invoice = quote.invoices[0];
  if (!invoice) {
    const invoiceNumber = await getNextInvoiceNumber(quote.businessId);
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    invoice = await prisma.invoice.create({
      data: {
        quoteId: quote.id,
        jobId: job.id,
        leadId: quote.leadId,
        businessId: quote.businessId,
        customerName: quote.lead.customerName,
        customerEmail: quote.lead.email,
        invoiceNumber,
        lineItems: quote.lineItems,
        subtotal: quote.total,
        total: quote.total,
        currency: quoteCurrency,
        status: "SENT",
        dueDate,
      },
      include: { business: true },
    });

    await prisma.activityLog.create({
      data: {
        businessId: quote.businessId,
        leadId: quote.leadId,
        quoteId: quote.id,
        jobId: job.id,
        invoiceId: invoice.id,
        entityType: "invoice",
        entityId: invoice.id,
        eventType: "invoice.drafted",
        status: "SUCCESS",
        detail: `Invoice ${invoiceNumber} automatically created for accepted quote (${formatAmount(quote.total, quoteCurrency)})`,
      },
    });
  }

  // Generate online payment link (Paystack / Stripe)
  if (invoice && !invoice.paymentLinkUrl) {
    const paymentLinkRes = await generateInvoicePaymentLink({
      invoice,
      business: quote.business,
      origin,
      callbackPath: `/q/${quote.quoteToken}?paid=true`,
    });
    if (paymentLinkRes.paymentLinkUrl) {
      invoice.paymentLinkUrl = paymentLinkRes.paymentLinkUrl;
      invoice.paymentReference = paymentLinkRes.paymentReference;
    }
  }

  // Log quote.accepted activity
  await prisma.activityLog.create({
    data: {
      businessId: quote.businessId,
      leadId: quote.leadId,
      quoteId: quote.id,
      entityType: "quote",
      entityId: quote.id,
      eventType: "quote.accepted",
      status: "SUCCESS",
      detail: `Quote accepted for ${formatAmount(quote.total, quoteCurrency)}`,
    },
  });

  const bank = getEffectiveBankDetails();

  return NextResponse.json({
    ok: true,
    quote: updatedQuote,
    job,
    invoice,
    payment: {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      paymentLinkUrl: invoice.paymentLinkUrl || null,
      total: quote.total,
      currency: quoteCurrency,
      totalFormatted: formatAmount(quote.total, quoteCurrency),
      ...bank,
    },
  });
}

