"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { CopyButton } from "@/app/(app)/leads/CopyButton";
import { ExternalLink, CheckCircle2, AlertCircle } from "lucide-react";

interface BusinessProfileFormProps {
  initialBusiness: {
    name: string;
    slug: string;
    email: string;
    paymentDetails?: string | null;
    googleReviewUrl?: string | null;
    quoteFollowUpDelayDays?: number;
    reviewReminderDelayDays?: number;
  };
}

export function BusinessProfileForm({ initialBusiness }: BusinessProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialBusiness.name);
  const [email, setEmail] = useState(initialBusiness.email);
  const [paymentDetails, setPaymentDetails] = useState(initialBusiness.paymentDetails || "");
  const [googleReviewUrl, setGoogleReviewUrl] = useState(initialBusiness.googleReviewUrl || "");
  const [quoteFollowUpDelayDays, setQuoteFollowUpDelayDays] = useState(
    initialBusiness.quoteFollowUpDelayDays ?? 3
  );
  const [reviewReminderDelayDays, setReviewReminderDelayDays] = useState(
    initialBusiness.reviewReminderDelayDays ?? 4
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/business/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          paymentDetails: paymentDetails.trim() || null,
          googleReviewUrl: googleReviewUrl.trim() || null,
          quoteFollowUpDelayDays: Number(quoteFollowUpDelayDays),
          reviewReminderDelayDays: Number(reviewReminderDelayDays),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        const fieldError = data.fields?.googleReviewUrl?.[0];
        setErrorMsg(fieldError || data.error || "Failed to update business profile.");
        return;
      }

      setSuccessMsg("Business profile updated successfully.");
      router.refresh();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const enquiryPath = `/enquiry/${initialBusiness.slug}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-success-bg)] text-[var(--color-primary)] rounded-[var(--radius-md)] border border-[#c1e6de]">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Business Name */}
      <div>
        <label htmlFor="bizName" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Business name
        </label>
        <input
          id="bizName"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
        />
      </div>

      {/* Business Email */}
      <div>
        <label htmlFor="bizEmail" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Business email (for replies and notifications)
        </label>
        <input
          id="bizEmail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
        />
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          This address is used as the Reply-To in customer automated emails.
        </p>
      </div>

      {/* Payment Details (Bank transfer details) */}
      <div>
        <label htmlFor="bizPayment" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Bank payment details <span className="font-normal text-[var(--color-text-muted)] lowercase">(included on invoices)</span>
        </label>
        <textarea
          id="bizPayment"
          rows={3}
          value={paymentDetails}
          onChange={(e) => setPaymentDetails(e.target.value)}
          placeholder="e.g. Bank: Barclays | Name: Apex Plumbing | Sort Code: 20-00-00 | Account: 12345678"
          className="w-full p-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-y"
        />
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          These payment instructions are automatically added to the footer of your customer invoice emails.
        </p>
      </div>

      {/* Google Review URL */}
      <div>
        <label htmlFor="googleReviewUrl" className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Google Review Link <span className="font-normal text-[var(--color-text-muted)] lowercase">(for automated review requests)</span>
        </label>
        <input
          id="googleReviewUrl"
          type="url"
          value={googleReviewUrl}
          onChange={(e) => setGoogleReviewUrl(e.target.value)}
          placeholder="https://g.page/r/... or https://maps.app.goo.gl/..."
          className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
        />
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Must match direct Google Maps or Business Profile patterns (e.g. g.page/, maps.app.goo.gl/, maps.google.com/).
        </p>

        {!googleReviewUrl.trim() && (
          <div className="mt-2.5 p-3 rounded-[var(--radius-md)] bg-[var(--color-status-action)] text-[#8C5A00] border border-[#edd7a6] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Review requests disabled:</strong> Add your Google review link to enable automated review requests when invoices are paid.
            </span>
          </div>
        )}
      </div>

      {/* Business Slug (Read-only) */}
      <div>
        <label className="block text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-1">
          Business slug <span className="font-normal text-[var(--color-text-muted)] lowercase">(read-only)</span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={initialBusiness.slug}
            className="w-full h-10 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] cursor-not-allowed"
          />
        </div>
        <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">
          Used to build your public URLs and cannot be modified.
        </p>
      </div>

      {/* Automation Delays */}
      <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-4">
        <div>
          <h3 className="text-xs font-bold text-[var(--color-text)] uppercase tracking-wider">
            Automated Follow-up Timing
          </h3>
          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
            Configure how many days Flowvo waits before sending automated reminder emails.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="quoteDelay" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Quote follow-up reminder
            </label>
            <select
              id="quoteDelay"
              value={quoteFollowUpDelayDays}
              onChange={(e) => setQuoteFollowUpDelayDays(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? "day" : "days"} after quote sent
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Default: 3 days</p>
          </div>

          <div>
            <label htmlFor="reviewDelay" className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Google review reminder
            </label>
            <select
              id="reviewDelay"
              value={reviewReminderDelayDays}
              onChange={(e) => setReviewReminderDelayDays(Number(e.target.value))}
              className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
            >
              {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                <option key={d} value={d}>
                  {d} {d === 1 ? "day" : "days"} after first request
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">Default: 4 days</p>
          </div>
        </div>
      </div>

      {/* Lead Form Link */}
      <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-2">
        <label className="block text-xs font-semibold text-[var(--color-text)]">
          Your public enquiry form link
        </label>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            readOnly
            value={enquiryPath}
            className="flex-1 h-9 px-3 text-xs font-mono rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-primary)] font-semibold truncate cursor-default"
          />
          <div className="flex items-center gap-2">
            <CopyButton text={enquiryPath} label="Copy form link" />
            <a
              href={enquiryPath}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              <span>Open</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          Place this link on your website, WhatsApp, email signature, or social media to receive customer enquiries.
        </p>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-sm font-semibold rounded-[var(--radius-md)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
          {isSubmitting ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
