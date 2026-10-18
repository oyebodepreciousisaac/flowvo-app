"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, CheckCircle2, XCircle, Copy, Check, ExternalLink, AlertCircle, MessageCircle, ClipboardCheck, DollarSign, Loader2 } from "lucide-react";
import { buildQuoteWhatsAppUrl } from "@/lib/whatsapp";

interface QuoteDetailActionsProps {
  quoteId: string;
  quoteToken: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  businessName?: string;
  totalFormatted: string;
  currentStatus: string;
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceStatus?: string | null;
}

export function QuoteDetailActions({
  quoteId,
  quoteToken,
  customerName,
  customerEmail,
  customerPhone,
  businessName = "Settlevo Business",
  totalFormatted,
  currentStatus,
  invoiceId,
  invoiceNumber,
  invoiceStatus,
}: QuoteDetailActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showConfirmPaidModal, setShowConfirmPaidModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const customerUrl = `/q/${quoteToken}`;
  const fullCustomerUrl = origin ? `${origin}${customerUrl}` : customerUrl;

  async function handleConfirmPaid() {
    if (!invoiceId) {
      setErrorMsg("No linked invoice found to mark as paid.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/paid`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to confirm payment.");
        return;
      }
      setShowConfirmPaidModal(false);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSendQuote() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "email" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send quote email.");
        return;
      }
      setShowSendModal(false);

      // (a) Send to Customer sends to both email and WhatsApp
      if (customerPhone && origin) {
        const waUrl = buildQuoteWhatsAppUrl({
          customerPhone,
          customerName,
          businessName,
          quoteTotalFormatted: totalFormatted,
          quoteUrl: fullCustomerUrl,
        });
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

      router.refresh();
    } catch {
      setErrorMsg("A network error occurred.");
    } finally {
      setLoading(false);
    }
  }

  // (b) Send to WhatsApp sends only to WhatsApp, not email
  async function handleSendWhatsAppOnly() {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (currentStatus === "DRAFT") {
        const res = await fetch(`/api/quotes/${quoteId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: "whatsapp" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Failed to update quote status.");
          return;
        }
      }

      if (customerPhone && origin) {
        const waUrl = buildQuoteWhatsAppUrl({
          customerPhone,
          customerName,
          businessName,
          quoteTotalFormatted: totalFormatted,
          quoteUrl: fullCustomerUrl,
        });
        window.open(waUrl, "_blank", "noopener,noreferrer");
      }

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



  return (
    <div className="space-y-4">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Primary Contextual Actions */}
      <div className="flex flex-wrap items-center gap-2">
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
            {/* Manual override buttons — for when customer accepts verbally / in person */}
            <div className="flex items-center gap-2 p-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)]">
              <ClipboardCheck className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
              <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:block">Manual record:</span>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange("accept")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-primary)] border border-[var(--color-primary)]/30 hover:bg-[var(--color-primary-subtle)] rounded transition-colors disabled:opacity-60"
                title="Record this quote as accepted manually (e.g. customer accepted verbally or in person)"
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Record accepted</span>
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleStatusChange("decline")}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[var(--color-error)] border border-[var(--color-error)]/30 hover:bg-red-50 rounded transition-colors disabled:opacity-60"
                title="Record this quote as declined manually"
              >
                <XCircle className="w-3 h-3" />
                <span>Record declined</span>
              </button>
            </div>
          </>
        )}

        {currentStatus === "ACCEPTED" && (
          <div className="flex flex-wrap items-center gap-2">
            {invoiceStatus === "PAID" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Payment Confirmed &amp; Settled</span>
              </span>
            ) : invoiceId ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmPaidModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                title="Confirm that bank transfer payment has entered your bank account"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm Payment Received (Bank Transfer)</span>
              </button>
            ) : null}

            {invoiceId && (
              <Link
                href={`/invoices/${invoiceId}`}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors shadow-2xs"
              >
                <span>View Invoice ({invoiceNumber || "INV"})</span>
              </Link>
            )}
          </div>
        )}

        {/* 1-Click Send via WhatsApp (Sends only on WhatsApp, marks as SENT if draft) */}
        {customerPhone && origin && (
          <button
            type="button"
            disabled={loading}
            onClick={handleSendWhatsAppOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            title="Send quote directly via WhatsApp without sending an email"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Send on WhatsApp</span>
          </button>
        )}

        {/* Shareable Customer Link */}
        <button
          type="button"
          onClick={() => {
            if (origin) {
              navigator.clipboard.writeText(`${origin}${customerUrl}`).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }).catch(() => setCopied(false));
            }
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors shadow-2xs"
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

            <div className="bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1.5">
              <div>Total amount: <strong className="font-semibold text-[var(--color-text)]">{totalFormatted}</strong></div>
              <div>• <strong>Email:</strong> Itemized quote sent to <span className="font-medium text-[var(--color-primary)]">{customerEmail}</span></div>
              {customerPhone && (
                <div>• <strong>WhatsApp:</strong> Opens chat to send directly to <span className="font-medium text-emerald-700">{customerPhone}</span></div>
              )}
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

      {/* Confirm Payment Received Modal */}
      {showConfirmPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)]">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] max-w-md w-full p-6 space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-2.5 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Confirm Payment Received?
              </h3>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Are you sure you want to confirm that payment for{" "}
              <strong className="text-[var(--color-text)]">{totalFormatted}</strong> has been received from{" "}
              <strong className="text-[var(--color-text)]">{customerName}</strong> into your bank account?
            </p>

            <div className="bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1">
              <div>Invoice: <strong className="font-semibold text-[var(--color-text)]">{invoiceNumber || "Auto-linked Invoice"}</strong></div>
              <div>Amount: <strong className="font-semibold text-[var(--color-text)]">{totalFormatted}</strong></div>
              <div>Customer: <span className="font-medium">{customerName} ({customerEmail})</span></div>
            </div>

            <p className="text-[11px] text-[var(--color-text-muted)]">
              This will update the invoice to <strong>PAID</strong>, log an official activity entry, and automatically send your review request if configured.
            </p>

            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowConfirmPaidModal(false)}
                className="px-4 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmPaid}
                className="px-4 py-2 text-xs font-semibold rounded-[var(--radius-md)] bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white transition-colors disabled:opacity-60 shadow-sm cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "Yes, Confirm Payment Received"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
