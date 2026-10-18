import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { isValidGoogleReviewUrl } from "@/lib/review";
import { reviewReminderHtml, reviewReminderText } from "@/lib/email-templates/review-reminder";
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
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 }
    );
  }

  // Minimum delay is 1 day, filtered by each business's reviewReminderDelayDays setting
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  const potentialReviews = await prisma.reviewRequest.findMany({
    where: {
      status: "SENT",
      sentAt: {
        lt: oneDayAgo,
      },
      reminderSentAt: null,
      unsubscribedAt: null,
    },
    include: {
      business: true,
      job: true,
    },
  });

  const eligibleReviews = potentialReviews.filter((review) => {
    const delayDays = review.business.reviewReminderDelayDays ?? 4;
    const cutoff = new Date(Date.now() - delayDays * 24 * 60 * 60 * 1000);
    return review.sentAt && review.sentAt < cutoff;
  });

  const origin = request.nextUrl.origin || "http://localhost:3000";
  let sentCount = 0;
  const processedIds: string[] = [];

  for (const review of eligibleReviews) {
    // Check if customer unsubscribed on another request for this business
    const priorUnsubscribe = await prisma.reviewRequest.findFirst({
      where: {
        businessId: review.businessId,
        customerEmail: review.customerEmail,
        unsubscribedAt: { not: null },
      },
    });

    if (priorUnsubscribe) {
      await prisma.reviewRequest.update({
        where: { id: review.id },
        data: { unsubscribedAt: priorUnsubscribe.unsubscribedAt },
      });
      continue;
    }

    if (!isValidGoogleReviewUrl(review.business.googleReviewUrl)) {
      continue;
    }

    const unsubscribeUrl = `${origin}/unsubscribe/${review.unsubscribeToken}`;

    const emailRes = await sendEmail({
      to: review.customerEmail,
      replyTo: review.business.email,
      fromName: review.business.name,
      subject: `Quick follow-up — ${review.business.name}`,
      html: reviewReminderHtml({
        customerName: review.customerName,
        businessName: review.business.name,
        serviceType: review.job?.description,
        googleReviewUrl: review.business.googleReviewUrl!,
        unsubscribeUrl,
      }),
      text: reviewReminderText({
        customerName: review.customerName,
        businessName: review.business.name,
        serviceType: review.job?.description,
        googleReviewUrl: review.business.googleReviewUrl!,
        unsubscribeUrl,
      }),
    });

    if (emailRes.success) {
      await prisma.reviewRequest.update({
        where: { id: review.id },
        data: {
          status: "REMINDER_SENT",
          reminderSentAt: new Date(),
        },
      });

      await prisma.activityLog.create({
        data: {
          businessId: review.businessId,
          jobId: review.jobId,
          invoiceId: review.invoiceId,
          entityType: "review",
          entityId: review.id,
          eventType: "review.reminder_sent",
          status: "SUCCESS",
          detail: `Automated 4-day review reminder sent to ${review.customerEmail}`,
        },
      });

      sentCount++;
      processedIds.push(review.id);
    } else {
      await prisma.activityLog.create({
        data: {
          businessId: review.businessId,
          jobId: review.jobId,
          invoiceId: review.invoiceId,
          entityType: "review",
          entityId: review.id,
          eventType: "review.reminder_failed",
          status: "FAILURE",
          detail: `Failed to send review reminder to ${review.customerEmail}: ${emailRes.error}`,
        },
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: eligibleReviews.length,
    sentCount,
    processedIds,
  });
}
