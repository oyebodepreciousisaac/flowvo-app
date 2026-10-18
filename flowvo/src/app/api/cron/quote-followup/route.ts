import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { quoteFollowUpHtml, quoteFollowUpText } from "@/lib/email-templates/quote-followup";
import { timingSafeCompare } from "@/lib/security";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  // CRON_SECRET verification
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");

  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, "") ?? xCronSecret;

  if (cronSecret && (!providedSecret || !timingSafeCompare(providedSecret, cronSecret))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If in production and CRON_SECRET is not configured at all, protect it
  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET not configured on server" }, { status: 500 });
  }

  // Minimum delay is 1 day, filtered by each business's quoteFollowUpDelayDays setting
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  const potentialQuotes = await prisma.quote.findMany({
    where: {
      status: "SENT",
      sentAt: {
        lt: oneDayAgo,
      },
      followUpSentAt: null,
    },
    include: {
      lead: true,
      business: true,
    },
  });

  const eligibleQuotes = potentialQuotes.filter((quote) => {
    const delayDays = quote.business.quoteFollowUpDelayDays ?? 3;
    const cutoff = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000);
    return quote.sentAt && quote.sentAt < cutoff;
  });

  const origin = request.nextUrl.origin || "http://localhost:3000";
  let sentCount = 0;
  const results = [];

  for (const quote of eligibleQuotes) {
    const acceptUrl = `${origin}/q/${quote.quoteToken}`;

    const emailRes = await sendEmail({
      to: quote.lead.email,
      replyTo: quote.business.email,
      fromName: quote.business.name,
      subject: `Following up on your quote from ${quote.business.name}`,
      html: quoteFollowUpHtml({
        customerName: quote.lead.customerName,
        businessName: quote.business.name,
        serviceType: quote.lead.serviceType,
        totalPence: quote.total,
        acceptUrl,
      }),
      text: quoteFollowUpText({
        customerName: quote.lead.customerName,
        businessName: quote.business.name,
        serviceType: quote.lead.serviceType,
        totalPence: quote.total,
        acceptUrl,
      }),
    });

    if (emailRes.success) {
      await prisma.quote.update({
        where: { id: quote.id },
        data: { followUpSentAt: new Date() },
      });

      await prisma.activityLog.create({
        data: {
          businessId: quote.businessId,
          leadId: quote.leadId,
          quoteId: quote.id,
          entityType: "quote",
          entityId: quote.id,
          eventType: "quote.followup_sent",
          status: "SUCCESS",
          detail: `Automated 3-day follow-up reminder sent to ${quote.lead.email}`,
        },
      });

      sentCount++;
      results.push({ quoteId: quote.id, status: "sent" });
    } else {
      await prisma.activityLog.create({
        data: {
          businessId: quote.businessId,
          leadId: quote.leadId,
          quoteId: quote.id,
          entityType: "quote",
          entityId: quote.id,
          eventType: "quote.followup_failed",
          status: "FAILURE",
          detail: `Automated follow-up failed: ${emailRes.error}`,
        },
      });
      results.push({ quoteId: quote.id, status: "failed", error: emailRes.error });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: eligibleQuotes.length,
    sent: sentCount,
    results,
  });
}
