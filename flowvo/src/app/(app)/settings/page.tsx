import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { BusinessProfileForm } from "./BusinessProfileForm";

export const metadata: Metadata = { title: "Settings — Flowvo" };

export default async function SettingsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const business = session.user.business;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Settings</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Manage your business profile, contact details, and customer links.
        </p>
      </div>

      <div className="max-w-[var(--container-narrow)] flex flex-col gap-6">
        {/* Business Profile Card */}
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-card)] p-6">
          <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Business profile</h2>
          <BusinessProfileForm
            initialBusiness={{
              name: business.name,
              slug: business.slug,
              email: business.email,
              paymentDetails: business.paymentDetails,
            }}
          />
        </div>

        {/* Future settings notice (Slice 7) */}
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] p-5 text-center bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-text-muted)]">
            Full settings (Google review link, bank payment details, automated follow-up delays) will be configured in Slice 7.
          </p>
        </div>
      </div>
    </div>
  );
}
