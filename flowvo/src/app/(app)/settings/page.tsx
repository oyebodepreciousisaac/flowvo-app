import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BusinessProfileForm } from "./BusinessProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata: Metadata = { title: "Settings — Flowvo" };

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  });

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your business profile, contact details, automation delays, and account security.
        </p>
      </div>

      <div className="max-w-[var(--container-narrow)] flex flex-col gap-6">
        {/* Business Profile & Automation Delays Card */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Business profile</h2>
          <BusinessProfileForm
            initialBusiness={{
              name: business.name,
              slug: business.slug,
              email: business.email,
              paymentDetails: business.paymentDetails,
              googleReviewUrl: business.googleReviewUrl,
              quoteFollowUpDelayDays: business.quoteFollowUpDelayDays,
              reviewReminderDelayDays: business.reviewReminderDelayDays,
            }}
          />
        </div>

        {/* Security & Password Card */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Security &amp; password</h2>
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
