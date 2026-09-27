import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CheckCircle2, AlertCircle } from "lucide-react";

interface PageProps {
  params: Promise<{ unsubscribeToken: string }>;
}

export const metadata: Metadata = {
  title: "Unsubscribe from Review Requests — Flowvo",
};

export default async function UnsubscribePage({ params }: PageProps) {
  const { unsubscribeToken } = await params;

  const reviewRequest = await prisma.reviewRequest.findUnique({
    where: { unsubscribeToken },
    include: {
      business: true,
    },
  });

  if (!reviewRequest) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
        <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center shadow-[var(--shadow-card)] space-y-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-error-bg)] text-[var(--color-error)] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text)]">
            Invalid or expired link
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            This unsubscribe link is not recognised or may have already expired.
          </p>
        </div>
      </main>
    );
  }

  // Mark all review requests for this customer and business as unsubscribed
  const now = new Date();
  await prisma.reviewRequest.updateMany({
    where: {
      businessId: reviewRequest.businessId,
      customerEmail: reviewRequest.customerEmail,
    },
    data: {
      unsubscribedAt: now,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: reviewRequest.businessId,
      entityType: "review",
      entityId: reviewRequest.id,
      eventType: "review.unsubscribed",
      status: "SUCCESS",
      detail: `Customer ${reviewRequest.customerEmail} unsubscribed from review requests for ${reviewRequest.business.name}`,
    },
  });

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-background)]">
      <div className="w-full max-w-md bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-8 text-center shadow-[var(--shadow-card)] space-y-4">
        <div className="w-12 h-12 rounded-full bg-[var(--color-success-bg)] text-[var(--color-primary)] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-[var(--color-text)]">
          You have been unsubscribed
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
          You will not receive any further review requests or feedback reminders from{" "}
          <strong className="text-[var(--color-text)]">{reviewRequest.business.name}</strong>.
        </p>
        <div className="pt-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            This preference has been recorded in compliance with privacy regulations. You can close this window.
          </p>
        </div>
      </div>
    </main>
  );
}
