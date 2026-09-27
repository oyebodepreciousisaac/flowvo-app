"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, CheckCircle2, FileText, AlertCircle } from "lucide-react";

interface JobScheduleEditorProps {
  jobId: string;
  customerName: string;
  initialScheduledDate: string | null;
  initialStatus: string;
  amountFormatted: string;
  invoiceId?: string;
}

export function JobScheduleEditor({
  jobId,
  customerName,
  initialScheduledDate,
  initialStatus,
  amountFormatted,
  invoiceId,
}: JobScheduleEditorProps) {
  const router = useRouter();

  const [scheduledDate, setScheduledDate] = useState(
    initialScheduledDate ? initialScheduledDate.split("T")[0] : ""
  );
  const [status, setStatus] = useState(initialStatus);
  const [isSavingDate, setIsSavingDate] = useState(false);
  const [dateSavedMsg, setDateSavedMsg] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSaveDate(e: React.FormEvent) {
    e.preventDefault();
    setIsSavingDate(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduledDate: scheduledDate ? new Date(scheduledDate).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update date.");
        return;
      }
      setDateSavedMsg(true);
      setTimeout(() => setDateSavedMsg(false), 2500);
      router.refresh();
    } catch {
      setErrorMsg("Network error.");
    } finally {
      setIsSavingDate(false);
    }
  }

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
        setErrorMsg(data.error || "Failed to complete job.");
        return;
      }
      setStatus("COMPLETE");
      setShowModal(false);
      router.refresh();
    } catch {
      setErrorMsg("Network error.");
    } finally {
      setLoading(false);
    }
  }

  const isComplete = status === "COMPLETE";

  return (
    <div className="space-y-6">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Date Scheduling Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)] space-y-3">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>Schedule Work Date</span>
        </h2>

        <form onSubmit={handleSaveDate} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="date"
            disabled={isComplete}
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            className="flex-1 h-10 px-3 text-sm rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)] disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-text-muted)]"
          />
          {!isComplete && (
            <button
              type="submit"
              disabled={isSavingDate}
              className="px-4 h-10 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] transition-colors disabled:opacity-60"
            >
              {isSavingDate ? "Saving..." : dateSavedMsg ? "Saved ✓" : "Save date"}
            </button>
          )}
        </form>
        <p className="text-[11px] text-[var(--color-text-muted)]">
          {scheduledDate
            ? `Job is scheduled for ${new Date(scheduledDate).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}.`
            : "No date scheduled yet."}
        </p>
      </div>

      {/* Primary Complete Button — Mobile-first 48px height per DESIGN.md */}
      <div className="pt-2">
        {isComplete ? (
          <div className="p-4 rounded-[var(--radius-lg)] bg-[var(--color-success-bg)] border border-[#bce3db] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)]">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>Job Completed · Invoice Auto-Drafted</span>
            </div>
            <Link
              href={invoiceId ? `/invoices/${invoiceId}` : "/invoices"}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 h-11 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm"
            >
              <FileText className="w-4 h-4" />
              <span>View draft invoice</span>
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 h-12 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-sm font-semibold rounded-[var(--radius-md)] shadow-sm transition-colors min-h-[48px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark job as complete</span>
          </button>
        )}
      </div>

      {/* Confirmation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)]">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Mark job complete for {customerName}?
            </h3>

            <div className="bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3.5 text-xs text-[var(--color-text-secondary)] space-y-1.5">
              <div>Amount: <strong className="font-semibold text-[var(--color-text)]">{amountFormatted}</strong></div>
              <div>
                This will mark the job complete and immediately generate a <strong>draft invoice</strong> ready for your review and send.
              </div>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-4 h-11 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkComplete}
                className="w-full sm:w-auto px-6 h-11 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors disabled:opacity-60 shadow-sm"
              >
                {loading ? "Completing..." : "Confirm complete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
