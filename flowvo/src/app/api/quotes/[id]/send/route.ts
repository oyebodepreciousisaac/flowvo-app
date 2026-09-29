import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { quoteEmailHtml, quoteEmailText, LineItem } from "@/lib/email-templates/quote-email";
import { isSameOrigin } from "@/lib/security";
import { formatAmount } from "@/lib/currency";

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

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      lead: true,
      business: true,
    },
  });

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  // Parse line items
  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(quote.lineItems);
  } catch {
    lineItems = [];
  }

  // Build public accept URL
  const origin = request.nextUrl.origin || "http://localhost:3000";
  const acceptUrl = `${origin}/q/${quote.quoteToken}`;
  const quoteCurrency = (quote.currency || quote.business.currency || "NGN").toUpperCase();

  // Send email to customer
  const emailRes = await sendEmail({
    to: quote.lead.email,
    replyTo: quote.business.email,
    fromName: quote.business.name,
    subject: `Quote from ${quote.business.name} — ${formatAmount(quote.total, quoteCurrency)}`,
    html: quoteEmailHtml({
      customerName: quote.lead.customerName,
      businessName: quote.business.name,
      lineItems,
      totalPence: quote.total,
      acceptUrl,
      currency: quoteCurrency,
    }),
    text: quoteEmailText({
      customerName: quote.lead.customerName,
      businessName: quote.business.name,
      lineItems,
      totalPence: quote.total,
      acceptUrl,
      currency: quoteCurrency,
    }),
  });

  // Update Quote record
  const updated = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "SENT",
      sentAt: new Date(),
    },
  });

  // Update Lead status to QUOTED
  if (quote.lead.status !== "WON" && quote.lead.status !== "LOST") {
    await prisma.lead.update({
      where: { id: quote.leadId },
      data: { status: "QUOTED" },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: session.user.businessId,
      leadId: quote.leadId,
      quoteId: quote.id,
      entityType: "quote",
      entityId: quote.id,
      eventType: emailRes.success ? "quote.sent" : "quote.send_failed",
      status: emailRes.success ? "SUCCESS" : "FAILURE",
      detail: emailRes.success
        ? `Quote sent to ${quote.lead.email}`
        : `Failed to send email: ${emailRes.error}`,
    },
  });

  return NextResponse.json({ ok: true, quote: updated });
}
