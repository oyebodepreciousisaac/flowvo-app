"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Printer,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  Eye,
  Coins,
} from "lucide-react";
import { buildInvoiceWhatsAppUrl, buildInvoicePaymentReminderWhatsAppUrl } from "@/lib/whatsapp";
import { SUPPORTED_CURRENCIES, convertCurrency, formatAmount } from "@/lib/currency";

interface InvoiceDetailActionsProps {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  businessName?: string;
  totalFormatted: string;
  currentStatus: string;
  emailDeliveryStatus: string;
  dueDateFormatted: string;
  paymentLinkUrl?: string | null;
  businessCurrency?: string;
  invoiceCurrency?: string;
  invoiceTotalPence?: number;
}

export function InvoiceDetailActions({
  invoiceId,
  invoiceNumber,
  customerName,
  customerEmail,
  customerPhone,
  businessName = "Flowvo Business",
  totalFormatted,
  currentStatus,
  emailDeliveryStatus,
  dueDateFormatted,
  paymentLinkUrl,
  businessCurrency = "NGN",
  invoiceCurrency = "NGN",
  invoiceTotalPence = 0,
}: InvoiceDetailActionsProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showPaidModal, setShowPaidModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(businessCurrency);
  const [convertAmounts, setConvertAmounts] = useState(true);
  const [currencyLoading, setCurrencyLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicInvoiceUrl = `${origin}/invoices/view/${invoiceId}`;

  const whatsappUrl = customerPhone
    ? buildInvoiceWhatsAppUrl({
        customerPhone,
        customerName,
        businessName,
        invoiceNumber,
        invoiceTotalFormatted: totalFormatted,
        dueDateFormatted,
        invoiceUrl: publicInvoiceUrl,
      })
    : null;

  function copyPublicLink() {
    navigator.clipboard.writeText(publicInvoiceUrl);
    setCopiedPublicLink(true);
    setTimeout(() => setCopiedPublicLink(false), 2500);
  }

  function copyPaymentLink() {
    if (!paymentLinkUrl) return;
    navigator.clipboard.writeText(paymentLinkUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  // (a) Send to Customer: sends email AND opens WhatsApp if phone exists
  async function handleSendInvoice() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "email" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to send invoice email.");
        return;
      }
      setShowSendModal(false);

      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // (b) Send to WhatsApp: sends only to WhatsApp, not email
  async function handleSendWhatsAppOnly() {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (currentStatus === "DRAFT") {
        const res = await fetch(`/api/invoices/${invoiceId}/send`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel: "whatsapp" }),
        });
        const data = await res.json();
        if (!res.ok) {
          setErrorMsg(data.error || "Failed to update invoice status.");
          return;
        }
      }

      if (whatsappUrl) {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }

      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkPaid() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/paid`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to mark invoice as paid.");
        return;
      }
      setShowPaidModal(false);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCurrencyChange() {
    setCurrencyLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/currency`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: selectedCurrency,
          convertAmount: convertAmounts,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to update invoice currency");
        return;
      }
      setShowCurrencyModal(false);
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setCurrencyLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Foreign currency notice if invoice currency doesn't match workspace default */}
      {invoiceCurrency.toUpperCase() !== businessCurrency.toUpperCase() && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs text-[var(--color-text)]">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-[var(--color-primary)] shrink-0" />
            <span>
              This invoice is recorded in <strong>{invoiceCurrency}</strong> while your workspace currency is <strong>{businessCurrency}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCurrency(businessCurrency);
              setShowCurrencyModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[var(--color-surface)] hover:bg-[var(--color-primary-subtle)] text-[var(--color-primary)] border border-[var(--color-border)] font-semibold cursor-pointer shrink-0 transition-colors shadow-2xs"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Convert / Switch to {businessCurrency}</span>
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {emailDeliveryStatus === "BOUNCED" && (
        <div className="flex items-start gap-2.5 p-3 text-xs bg-[var(--color-status-overdue)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Email bounced:</span> Delivery to{" "}
            <strong>{customerEmail}</strong> failed. Please verify the customer&apos;s email address.
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {currentStatus === "DRAFT" && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowSendModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Review &amp; send invoice</span>
          </button>
        )}

        {(currentStatus === "SENT" || currentStatus === "OVERDUE") && (
          <button
            type="button"
            disabled={loading}
            onClick={() => setShowPaidModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark as paid</span>
          </button>
        )}

        {currentStatus === "PAID" && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] bg-[var(--color-status-complete)] text-[var(--color-primary)] text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Paid in full</span>
          </div>
        )}

        {/* Dedicated Printable Invoice Trigger */}
        <Link
          href={`/invoices/${invoiceId}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-2xs"
        >
          <Printer className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
          <span>Print / PDF</span>
        </Link>

        {/* Change / Convert Currency Trigger */}
        <button
          type="button"
          onClick={() => {
            setSelectedCurrency(businessCurrency);
            setShowCurrencyModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-2xs cursor-pointer"
          title="Change invoice currency or convert via FX rates"
        >
          <Coins className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
          <span>Currency: {invoiceCurrency}</span>
        </button>

        {/* 1-Click Send on WhatsApp (Sends only on WhatsApp, marks as SENT if draft) */}
        {whatsappUrl && (
          <button
            type="button"
            disabled={loading}
            onClick={handleSendWhatsAppOnly}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            title="Send invoice directly via WhatsApp without sending an email"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Send on WhatsApp</span>
          </button>
        )}

        {/* 1-Click Payment Reminder via WhatsApp for Sent/Overdue Invoices */}
        {(currentStatus === "SENT" || currentStatus === "OVERDUE") && customerPhone && (
          <a
            href={buildInvoicePaymentReminderWhatsAppUrl({
              customerPhone,
              customerName,
              businessName,
              invoiceNumber,
              invoiceTotalFormatted: totalFormatted,
              dueDateFormatted,
              invoiceUrl: publicInvoiceUrl,
              isOverdue: currentStatus === "OVERDUE",
            })}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm cursor-pointer"
            title="Send polite WhatsApp payment reminder to customer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span>Send WhatsApp Reminder</span>
          </a>
        )}

        {/* Copy Public Customer Invoice Link */}
        <button
          type="button"
          onClick={copyPublicLink}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] text-xs font-semibold rounded-[var(--radius-md)] transition-colors cursor-pointer shadow-2xs"
          title="Copy customer view and payment link"
        >
          {copiedPublicLink ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-bold">Copied Public Link!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
              <span>Copy Customer Link</span>
            </>
          )}
        </button>

        {/* Customer Public View Preview */}
        <Link
          href={`/invoices/view/${invoiceId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-2xs"
          title="Preview public invoice checkout page"
        >
          <Eye className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
          <span>Preview Customer View</span>
        </Link>

        {/* Online Payment Link Shortcuts */}
        {paymentLinkUrl && currentStatus !== "PAID" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyPaymentLink}
              className="inline-flex items-center gap-1.5 px-3 py-2 border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] text-xs font-semibold rounded-[var(--radius-md)] transition-colors cursor-pointer"
              title="Copy customer payment link to clipboard"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                  <span className="text-[var(--color-primary)]">Copied Link!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
                  <span>Copy Payment Link</span>
                </>
              )}
            </button>

            <a
              href={paymentLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:bg-[#d6ece7] text-xs font-semibold rounded-[var(--radius-md)] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Customer Payment Portal</span>
            </a>
          </div>
        )}
      </div>

      {/* Modal: Review & Send Confirmation */}
      {showSendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Send invoice {invoiceNumber}
              </h3>
              <div className="mt-3 p-3 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs space-y-1.5">
                <div>Total amount: <strong className="font-semibold text-[var(--color-text)]">{totalFormatted}</strong></div>
                <div>• <strong>Email:</strong> Itemized invoice sent to <span className="font-semibold text-[var(--color-text)]">{customerEmail}</span></div>
                {customerPhone && (
                  <div>• <strong>WhatsApp:</strong> Opens chat to send directly to <span className="font-semibold text-emerald-700">{customerPhone}</span></div>
                )}
                <div>• <strong>Payment due:</strong> <span className="font-semibold text-[var(--color-text)]">{dueDateFormatted}</span></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowSendModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSendInvoice}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-[var(--radius-md)] shadow-sm disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{loading ? "Sending..." : "Confirm and send"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Mark as Paid Confirmation */}
      {showPaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 shadow-xl space-y-4">
            <div>
              <h3 className="text-base font-bold text-[var(--color-text)]">
                Mark invoice {invoiceNumber} as paid
              </h3>
              <p className="mt-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Confirm you have received full payment of{" "}
                <strong className="text-[var(--color-text)]">{totalFormatted}</strong> from{" "}
                <strong className="text-[var(--color-text)]">{customerName}</strong>.
              </p>
              <div className="mt-3 p-3 bg-[var(--color-status-action)] text-[#8C5A00] rounded-[var(--radius-md)] border border-[#edd7a6] text-xs leading-relaxed">
                <span className="font-bold">Next automatic action:</span> Marking this invoice as paid
                will immediately queue an automated Google review request to {customerName}.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowPaidModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-[var(--radius-md)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleMarkPaid}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-[var(--radius-md)] shadow-sm disabled:opacity-50"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{loading ? "Saving..." : "Confirm payment received"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Switch / Convert Currency */}
      {showCurrencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-overlay)] animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-[var(--color-text)]">
              <Coins className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-base font-bold">
                Update Currency for {invoiceNumber}
              </h3>
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Current invoice currency: <strong>{invoiceCurrency}</strong> ({totalFormatted}).
              Workspace default: <strong>{businessCurrency}</strong>.
            </p>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text)] mb-1">
                  Select New Currency
                </label>
                <select
                  value={selectedCurrency}
                  onChange={(e) => setSelectedCurrency(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {Object.entries(SUPPORTED_CURRENCIES).map(([code, config]) => (
                    <option key={code} value={code}>
                      {config.flag} {config.code} — {config.name} ({config.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-[var(--color-text)]">
                  <input
                    type="checkbox"
                    checked={convertAmounts}
                    onChange={(e) => setConvertAmounts(e.target.checked)}
                    className="mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold block">Convert amount using exchange rate</span>
                    <span className="text-[11px] text-[var(--color-text-secondary)] block mt-0.5">
                      {convertAmounts ? (
                        <>
                          Converts {totalFormatted} to approx{" "}
                          <strong className="text-[var(--color-primary)]">
                            {formatAmount(
                              convertCurrency(invoiceTotalPence, invoiceCurrency, selectedCurrency),
                              selectedCurrency
                            )}
                          </strong>
                        </>
                      ) : (
                        "Keep numerical figure as-is and only change the currency denomination/symbol."
                      )}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                disabled={currencyLoading}
                onClick={() => setShowCurrencyModal(false)}
                className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] rounded-[var(--radius-md)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={currencyLoading || selectedCurrency === invoiceCurrency}
                onClick={handleCurrencyChange}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-[var(--radius-md)] shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{currencyLoading ? "Updating..." : "Save Currency"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
