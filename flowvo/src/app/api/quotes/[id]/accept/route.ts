import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: tokenOrId } = await context.params;

  // 1. Try finding by quoteToken (public customer accept)
  let quote = await prisma.quote.findUnique({
    where: { quoteToken: tokenOrId },
    include: {
      lead: true,
      business: true,
      jobs: true,
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
      },
    });
  }

  if (!quote) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  if (quote.status === "ACCEPTED") {
    return NextResponse.json({ ok: true, message: "Quote is already accepted" });
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
        detail: `Job auto-created from accepted quote (£${(quote.total / 100).toFixed(2)})`,
      },
    });
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
      detail: `Quote accepted for £${(quote.total / 100).toFixed(2)}`,
    },
  });

  return NextResponse.json({ ok: true, quote: updatedQuote, job });
}
