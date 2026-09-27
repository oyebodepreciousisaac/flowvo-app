import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tokenOrId } = await context.params;

  // 1. Try finding by quoteToken (public customer decline)
  let quote = await prisma.quote.findUnique({
    where: { quoteToken: tokenOrId },
    include: { lead: true, business: true },
  });

  // 2. If not found by token, try finding by ID (requires owner session)
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
      include: { lead: true, business: true },
    });
  }

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status === "DECLINED") {
    return NextResponse.json({ ok: true, message: "Quote is already declined" });
  }

  // Update Quote
  const updatedQuote = await prisma.quote.update({
    where: { id: quote.id },
    data: {
      status: "DECLINED",
      declinedAt: quote.declinedAt || new Date(),
    },
  });

  // Update Lead status to LOST
  await prisma.lead.update({
    where: { id: quote.leadId },
    data: { status: "LOST" },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: quote.businessId,
      leadId: quote.leadId,
      quoteId: quote.id,
      entityType: "quote",
      entityId: quote.id,
      eventType: "quote.declined",
      status: "SUCCESS",
      detail: "Quote declined",
    },
  });

  return NextResponse.json({ ok: true, quote: updatedQuote });
}
