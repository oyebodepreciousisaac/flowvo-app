import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/currency";
import { broadcastLiveEvent } from "@/lib/live-channel";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tokenOrId } = await context.params;

  // Find quote by quoteToken or id
  const quote = await prisma.quote.findFirst({
    where: {
      OR: [{ quoteToken: tokenOrId }, { id: tokenOrId }],
    },
    include: {
      lead: true,
      business: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { senderName, bankName, reference, note, receiptDataUrl } = body || {};

  const invoice = quote.invoices[0];
  const currency = (quote.currency || quote.business.currency || "NGN").toUpperCase();
  const totalFormatted = formatAmount(quote.total, currency);

  const receiptDetailObj = {
    senderName: (senderName || quote.lead.customerName || "Customer").trim(),
    bankName: (bankName || "Bank Transfer").trim(),
    reference: (reference || invoice?.invoiceNumber || quote.quoteToken.slice(0, 8)).trim(),
    note: (note || "").trim(),
    receiptDataUrl: receiptDataUrl ? String(receiptDataUrl) : null,
    amount: quote.total,
    currency,
    submittedAt: new Date().toISOString(),
  };

  const receiptJsonString = JSON.stringify(receiptDetailObj);

  // Store in ActivityLog
  const activityLog = await prisma.activityLog.create({
    data: {
      businessId: quote.businessId,
      leadId: quote.leadId,
      quoteId: quote.id,
      invoiceId: invoice?.id || null,
      entityType: "quote",
      entityId: quote.id,
      eventType: "payment.receipt_submitted",
      status: "SUCCESS",
      detail: receiptJsonString,
    },
  });

  // Also log for invoice if invoice exists
  if (invoice) {
    await prisma.activityLog.create({
      data: {
        businessId: quote.businessId,
        leadId: quote.leadId,
        quoteId: quote.id,
        invoiceId: invoice.id,
        entityType: "invoice",
        entityId: invoice.id,
        eventType: "payment.receipt_submitted",
        status: "SUCCESS",
        detail: `Bank transfer receipt submitted by ${receiptDetailObj.senderName} (${receiptDetailObj.bankName}, Ref: ${receiptDetailObj.reference})`,
      },
    });
  }

  // Broadcast live event to update business owner screen in real-time
  try {
    broadcastLiveEvent("RECEIPT_SUBMITTED", {
      quoteId: quote.id,
      invoiceId: invoice?.id,
      businessId: quote.businessId,
      totalFormatted,
      senderName: receiptDetailObj.senderName,
      bankName: receiptDetailObj.bankName,
    });
  } catch {
    // Non-fatal
  }

  return NextResponse.json({
    ok: true,
    message: "Receipt received successfully. The business owner has been notified to verify and confirm your payment.",
    receipt: receiptDetailObj,
  });
}
