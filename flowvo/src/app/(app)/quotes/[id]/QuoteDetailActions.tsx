"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle2, XCircle, Copy, Check, ExternalLink, AlertCircle } from "lucide-react";

interface QuoteDetailActionsProps {
  quoteId: string;
  quoteToken: string;
  customerName: string;
  customerEmail: string;
  totalFormatted: string;
  currentStatus: string;
}

export function QuoteDetailActions({
  quoteId,
  quoteToken,
  customerName,
  customerEmail,
  totalFormatted,
  currentStatus,
}: QuoteDetailActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const customerUrl = `/q/${quoteToken}`;

  async function handleSendQuote() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send quote email.");
        return;
      }
      setShowSendModal(false);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(action: "accept" | "decline") {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/${action}`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || `Failed to mark quote as ${action}ed.`);
        return;
      }
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCustomerLink() {
    try {
      const fullUrl = `${window.location.origin}${customerUrl}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Contextual Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {currentStatus === "DRAFT" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowSendModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm disabled:opacity-60"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send quote to customer</span>
          </button>
        )}

        {currentStatus === "SENT" && (
          <>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleStatusChange("accept")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-md)] transition-colors disabled:opacity-60 shadow-sm"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark accepted</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleStatusChange("decline")}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--color-error)] border border-[var(--color-error)] hover:bg-[#ffebeb] rounded-[var(--radius-md)] transition-colors disabled:opacity-60"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Mark declined</span>
            </button>
          </>
        )}

        {/* Shareable Customer Link */}
        <button
          type="button"
          onClick={handleCopyCustomerLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />
              <span className="text-[var(--color-primary)] font-semibold">Link copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
              <span>Copy customer link</span>
            </>
          )}
        </button>

        <a
          href={customerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
        >
          <span>Preview acceptance page</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Confirmation Modal per DESIGN.md Section 7.10 */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)]">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <h3 className="text-base font-bold text-[var(--color-text)]">
              Send quote to {customerName}?
            </h3>

            <div className="bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1">
              <div>Total amount: <strong className="font-semibold text-[var(--color-text)]">{totalFormatted}</strong></div>
              <div>This will email an itemized quote and acceptance link to:</div>
              <div className="font-medium text-[var(--color-primary)]">{customerEmail}</div>
            </div>

            <p className="text-xs text-[var(--color-text-muted)]">
              Once sent, the quote status will change to <strong>SENT</strong> and our automated 3-day follow-up reminder will be scheduled.
            </p>

            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowSendModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSendQuote}
                className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors disabled:opacity-60 shadow-sm"
              >
                {loading ? "Sending quote..." : "Send quote"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
