"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, FileText, AlertCircle } from "lucide-react";

interface JobCardActionProps {
  jobId: string;
  customerName: string;
  amountFormatted: string;
  status: string;
  invoiceId?: string;
}

export function JobCardAction({
  jobId,
  customerName,
  amountFormatted,
  status,
  invoiceId,
}: JobCardActionProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleMarkComplete() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "COMPLETE" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to mark job complete.");
        return;
      }
      setShowModal(false);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (status === "COMPLETE") {
    return (
      <Link
        href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"}
        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] hover:bg-[#d6ece7] text-[var(--color-primary)] transition-colors"
      >
        <FileText className="w-3.5 h-3.5" />
        <span>View invoice</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white transition-colors shadow-sm min-h-[36px]"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Mark complete</span>
      </button>

      {/* Confirmation Modal per DESIGN.md */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)]">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Mark job complete for {customerName}?
            </h3>

            <div className="bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1">
              <div>Amount: <strong className="font-semibold text-[var(--color-text)]">{amountFormatted}</strong></div>
              <div>This will mark the job complete and automatically create a <strong>draft invoice</strong> ready to review and send.</div>
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 p-2.5 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkComplete}
                className="px-5 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors disabled:opacity-60 shadow-sm min-h-[44px]"
              >
                {loading ? "Completing..." : "Confirm complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
