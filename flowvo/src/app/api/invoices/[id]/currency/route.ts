import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin } from "@/lib/security";
import { convertCurrency, SUPPORTED_CURRENCIES } from "@/lib/currency";

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
  const body = await request.json().catch(() => ({}));
  const targetCurrency = String(body.currency || "").toUpperCase();
  const convertAmount = body.convertAmount !== undefined ? Boolean(body.convertAmount) : true;

  if (!SUPPORTED_CURRENCIES[targetCurrency]) {
    return NextResponse.json(
      { error: `Invalid currency. Supported: ${Object.keys(SUPPORTED_CURRENCIES).join(", ")}` },
      { status: 400 }
    );
  }

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
    include: { business: true },
  });

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  const oldCurrency = (invoice.currency || "NGN").toUpperCase();
  if (oldCurrency === targetCurrency) {
    return NextResponse.json({ success: true, invoice });
  }

  let newTotal = invoice.total;
  let newSubtotal = invoice.subtotal;

  if (convertAmount) {
    newTotal = convertCurrency(invoice.total, oldCurrency, targetCurrency);
    newSubtotal = convertCurrency(invoice.subtotal, oldCurrency, targetCurrency);
  }

  // Also convert line items if valid JSON
  let newLineItems = invoice.lineItems;
  if (convertAmount) {
    try {
      const parsed = JSON.parse(invoice.lineItems);
      if (Array.isArray(parsed)) {
        const updatedItems = parsed.map((item: any) => ({
          ...item,
          unitPricePence: convertCurrency(item.unitPricePence || 0, oldCurrency, targetCurrency),
          lineTotalPence: convertCurrency(item.lineTotalPence || 0, oldCurrency, targetCurrency),
        }));
        newLineItems = JSON.stringify(updatedItems);
      }
    } catch {
      // Keep existing lineItems if parse fails
    }
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      currency: targetCurrency,
      total: newTotal,
      subtotal: newSubtotal,
      lineItems: newLineItems,
    },
  });

  await prisma.activityLog.create({
    data: {
      businessId: session.user.businessId,
      leadId: invoice.leadId,
      quoteId: invoice.quoteId,
      jobId: invoice.jobId,
      invoiceId: invoice.id,
      entityType: "invoice",
      entityId: invoice.id,
      eventType: "invoice.currency_updated",
      status: "SUCCESS",
      detail: `Currency updated from ${oldCurrency} to ${targetCurrency}${
        convertAmount ? " (amounts normalized at standard FX rate)" : ""
      }`,
    },
  });

  return NextResponse.json({ success: true, invoice: updatedInvoice });
}
