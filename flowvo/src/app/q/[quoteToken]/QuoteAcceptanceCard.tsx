"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface QuoteAcceptanceCardProps {
  quoteToken: string;
  initialStatus: string;
  businessName: string;
  totalFormatted: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
}

export function QuoteAcceptanceCard({
  quoteToken,
  initialStatus,
  businessName,
  totalFormatted,
  acceptedAt,
  declinedAt,
}: QuoteAcceptanceCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  async function handleAccept() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/quotes/${quoteToken}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to accept quote. Please try again.");
        return;
      }
      setStatus("ACCEPTED");
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDecline() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/quotes/${quoteToken}/decline`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update quote. Please try again.");
        return;
      }
      setStatus("DECLINED");
      setShowDeclineConfirm(false);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "ACCEPTED") {
    return (
      <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-success-bg)] border border-[#bce3db] text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-[var(--color-primary)]">
          Quote Accepted
        </h3>
        <p className="text-sm text-[var(--color-text)] max-w-md mx-auto">
          Thank you for accepting this quote for <strong className="font-semibold">{totalFormatted}</strong>.{" "}
          <strong className="font-semibold">{businessName}</strong> has been notified and will be in touch shortly to schedule the work.
        </p>
      </div>
    );
  }

  if (status === "DECLINED") {
    return (
      <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-center space-y-2">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)]">
          <XCircle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[var(--color-text-secondary)]">
          Quote Declined
        </h3>
        <p className="text-xs text-[var(--color-text-muted)]">
          This quote has been declined. If your requirements have changed or you wish to request an updated quote, please get in touch with {businessName}.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4 border-t border-[var(--color-border)]">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {showDeclineConfirm ? (
        <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-3">
          <p className="text-xs font-medium text-[var(--color-text)]">
            Are you sure you want to decline this quote from {businessName}?
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={handleDecline}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-[var(--color-error)] hover:bg-[#a11818] rounded-[var(--radius-md)] transition-colors disabled:opacity-60"
            >
              {loading ? "Declining..." : "Yes, decline quote"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => setShowDeclineConfirm(false)}
              className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] rounded-[var(--radius-md)] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => setShowDeclineConfirm(true)}
            className="text-xs font-medium text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors underline"
          >
            Decline quote
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleAccept}
            className="w-full sm:w-auto px-6 py-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-sm font-semibold rounded-[var(--radius-md)] shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Accepting quote..." : `Accept Quote · ${totalFormatted}`}
          </button>
        </div>
      )}
    </div>
  );
}
