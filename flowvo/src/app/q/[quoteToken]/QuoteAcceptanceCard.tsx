"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  CreditCard,
  Building2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Printer,
  Upload,
  FileCheck,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { broadcastLiveEvent } from "@/lib/live-channel";
import { buildCustomerPaymentProofWhatsAppUrl } from "@/lib/whatsapp";

export interface PaymentInfo {
  invoiceId?: string | null;
  invoiceNumber?: string | null;
  invoiceStatus?: string | null;
  paidAtFormatted?: string | null;
  paymentLinkUrl?: string | null;
  paymentReference?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentNotes?: string | null;
  businessPhone?: string | null;
  receiptSubmitted?: boolean;
  receiptDetails?: {
    senderName?: string;
    bankName?: string;
    reference?: string;
    note?: string;
    submittedAt?: string;
  } | null;
}

interface QuoteAcceptanceCardProps {
  quoteToken: string;
  initialStatus: string;
  businessName: string;
  totalFormatted: string;
  currency: string;
  acceptedAt?: string | null;
  declinedAt?: string | null;
  initialPaymentInfo?: PaymentInfo | null;
}

export function QuoteAcceptanceCard({
  quoteToken,
  initialStatus,
  businessName,
  totalFormatted,
  currency,
  acceptedAt,
  declinedAt,
  initialPaymentInfo,
}: QuoteAcceptanceCardProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeclineConfirm, setShowDeclineConfirm] = useState(false);

  // Payment details state
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(
    initialPaymentInfo || null
  );
  const [activePaymentTab, setActivePaymentTab] = useState<"card" | "bank">(
    initialPaymentInfo?.paymentLinkUrl ? "card" : "bank"
  );

  // Copy helper states
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Receipt submission state
  const [senderName, setSenderName] = useState("");
  const [senderBank, setSenderBank] = useState("");
  const [transferRef, setTransferRef] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [receiptFileBase64, setReceiptFileBase64] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [receiptSuccessMsg, setReceiptSuccessMsg] = useState<string | null>(null);
  const [receiptSubmitted, setReceiptSubmitted] = useState(
    initialPaymentInfo?.receiptSubmitted ?? false
  );

  const isPaid = paymentInfo?.invoiceStatus === "PAID";
  const contactPhone = paymentInfo?.businessPhone || "";
  const invoiceNumber = paymentInfo?.invoiceNumber || `Q-${quoteToken.slice(0, 8).toUpperCase()}`;

  function handleCopyAccount() {
    if (!paymentInfo?.bankAccountNumber) return;
    navigator.clipboard.writeText(paymentInfo.bankAccountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  }

  function handleCopyRef() {
    const refToCopy = paymentInfo?.invoiceNumber || quoteToken.slice(0, 8);
    navigator.clipboard.writeText(refToCopy);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  }

  function handleReceiptFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setReceiptFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptFileBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

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
      if (data.payment) {
        setPaymentInfo(data.payment);
        if (data.payment.paymentLinkUrl) {
          setActivePaymentTab("card");
        } else {
          setActivePaymentTab("bank");
        }
      }
      broadcastLiveEvent("QUOTE_ACCEPTED", { quoteToken });
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
      broadcastLiveEvent("QUOTE_DECLINED", { quoteToken });
      router.refresh();
    } catch {
      setErrorMsg("A network error occurred. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReceipt(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingReceipt(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/quotes/${quoteToken}/receipt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName,
          bankName: senderBank,
          reference: transferRef || invoiceNumber,
          note: transferNote,
          receiptDataUrl: receiptFileBase64,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit receipt proof. Please try again.");
        return;
      }

      setReceiptSubmitted(true);
      setReceiptSuccessMsg("Receipt successfully submitted! The business owner has been notified.");
      router.refresh();
    } catch {
      setErrorMsg("Failed to upload receipt proof. Please check your network.");
    } finally {
      setSubmittingReceipt(false);
    }
  }

  const whatsappProofUrl = contactPhone
    ? buildCustomerPaymentProofWhatsAppUrl({
        ownerPhone: contactPhone,
        businessName,
        customerName: "Valued Customer",
        invoiceNumber,
        invoiceTotalFormatted: totalFormatted,
      })
    : null;

  // ─── 1. ACCEPTED VIEW (WITH COMPREHENSIVE PAYMENT OPTIONS) ─────────────────
  if (status === "ACCEPTED") {
    return (
      <div className="space-y-6">
        {/* Quote Accepted Confirmation Badge */}
        <div className="p-6 rounded-[var(--radius-lg)] bg-[var(--color-success-bg)] border border-[#bce3db] text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[var(--color-primary)]">
            Quote Accepted ✔️
          </h3>
          <p className="text-sm text-[var(--color-text)] max-w-md mx-auto">
            Thank you for accepting this quote for{" "}
            <strong className="font-semibold">{totalFormatted}</strong>.{" "}
            <strong className="font-semibold">{businessName}</strong> has been notified and the work has been scheduled.
          </p>
          {acceptedAt && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Accepted on {new Date(acceptedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        {/* If payment has already been confirmed as PAID */}
        {isPaid ? (
          <div className="rounded-[var(--radius-lg)] border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 p-6 md:p-8 text-center space-y-4 shadow-sm">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300">
                Payment Settled
              </span>
              <h3 className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100">
                Payment Received in Full
              </h3>
              <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                {paymentInfo?.paidAtFormatted
                  ? `Confirmed on ${paymentInfo.paidAtFormatted}`
                  : "Thank you for your payment."}
              </p>
            </div>

            {paymentInfo?.paymentReference && (
              <div className="inline-block px-3 py-1 bg-white dark:bg-emerald-900/30 rounded border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-900 dark:text-emerald-200">
                Receipt Ref: {paymentInfo.paymentReference}
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              {paymentInfo?.invoiceId && (
                <Link
                  href={`/invoices/${paymentInfo.invoiceId}/print`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Download Official Receipt (PDF)</span>
                </Link>
              )}

              {whatsappProofUrl && (
                <a
                  href={whatsappProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-emerald-900/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 text-xs font-semibold rounded-[var(--radius-md)] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Message {businessName}</span>
                </a>
              )}
            </div>
          </div>
        ) : (
          /* Payment Processing Card */
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
            {/* Header: Amount Due & Method Toggle */}
            <div className="px-6 py-4 bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-text-muted)]">
                  Total Amount Payable
                </span>
                <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)] font-mono">
                  {totalFormatted}
                </div>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center bg-[var(--color-surface)] p-1 rounded-[var(--radius-md)] border border-[var(--color-border)]">
                {paymentInfo?.paymentLinkUrl && (
                  <button
                    type="button"
                    onClick={() => setActivePaymentTab("card")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                      activePaymentTab === "card"
                        ? "bg-[var(--color-primary)] text-white shadow-xs"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Online (Paystack)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActivePaymentTab("bank")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                    activePaymentTab === "bank"
                      ? "bg-[var(--color-primary)] text-white shadow-xs"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Direct Bank Transfer</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* TAB 1: PAY ONLINE (PAYSTACK / CARDS / USSD) */}
              {activePaymentTab === "card" && paymentInfo?.paymentLinkUrl && (
                <div className="space-y-4">
                  <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text)] space-y-1">
                    <div className="flex items-center gap-1.5 font-semibold text-[var(--color-primary)]">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Instant &amp; Verified Payment</span>
                    </div>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">
                      Pay directly using Debit/Credit Card, Bank App Transfer, USSD, or Apple Pay via Paystack.
                      Your payment will be verified immediately and your official receipt generated automatically.
                    </p>
                  </div>

                  <a
                    href={paymentInfo.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-base font-bold rounded-[var(--radius-md)] transition-colors shadow-md text-center cursor-pointer"
                  >
                    <CreditCard className="w-5 h-5 flex-shrink-0" />
                    <span>Pay {totalFormatted} Online (Paystack)</span>
                    <ExternalLink className="w-4 h-4 opacity-75" />
                  </a>

                  <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--color-text-muted)] pt-1">
                    <span>🔒 256-bit SSL Encrypted</span>
                    <span>•</span>
                    <span>Instant Verification</span>
                    <span>•</span>
                    <span>Automated Receipt</span>
                  </div>
                </div>
              )}

              {/* TAB 2: DIRECT BANK TRANSFER (PAY WITHOUT PLATFORM) */}
              {(activePaymentTab === "bank" || !paymentInfo?.paymentLinkUrl) && (
                <div className="space-y-5">
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    Pay without using the online payment gateway by making a direct transfer of{" "}
                    <strong>{totalFormatted}</strong> to the verified business account below:
                  </div>

                  {paymentInfo?.bankAccountNumber ? (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-3.5 font-mono text-xs">
                      {/* Bank Name */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-[var(--color-border)]">
                        <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                          Settlement Bank
                        </span>
                        <span className="font-bold text-[var(--color-text)] text-sm">
                          {paymentInfo.bankName || "Official Settlement Bank"}
                        </span>
                      </div>

                      {/* Account Number with 1-Click Copy */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-border)]">
                        <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                          Account Number
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-extrabold text-[var(--color-primary)] tracking-wider">
                            {paymentInfo.bankAccountNumber}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyAccount}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[var(--color-surface)] hover:bg-[var(--color-primary-subtle)] text-[var(--color-text)] hover:text-[var(--color-primary)] border border-[var(--color-border)] text-xs font-sans font-semibold transition-colors cursor-pointer shadow-2xs"
                            title="Copy account number"
                          >
                            {copiedAccount ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Account Name */}
                      {paymentInfo.bankAccountName && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-[var(--color-border)]">
                          <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                            Account Name
                          </span>
                          <span className="font-semibold text-[var(--color-text)]">
                            {paymentInfo.bankAccountName}
                          </span>
                        </div>
                      )}

                      {/* Payment Reference with Copy */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                          Payment Reference
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-[var(--color-text)]">
                            {invoiceNumber}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopyRef}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-0.5 cursor-pointer"
                            title="Copy payment reference"
                          >
                            {copiedRef ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : paymentInfo?.paymentNotes ? (
                    <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs font-mono whitespace-pre-wrap text-[var(--color-text)] leading-relaxed">
                      {paymentInfo.paymentNotes}
                    </div>
                  ) : (
                    <div className="p-4 rounded-[var(--radius-md)] bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      Please contact {businessName} directly for bank settlement account details.
                    </div>
                  )}

                  {/* Section: Confirm Money Sent / Send Receipt */}
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                        After Transferring: Send Receipt &amp; Confirm
                      </h4>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                        Send proof of transfer so {businessName} can verify that the money has entered and confirm your payment.
                      </p>
                    </div>

                    {/* Receipt Status: Already submitted */}
                    {receiptSubmitted ? (
                      <div className="p-4 rounded-[var(--radius-md)] bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-emerald-800">
                          <FileCheck className="w-4 h-4 text-emerald-600" />
                          <span>Receipt Proof Submitted for Verification ⏳</span>
                        </div>
                        <p className="text-emerald-800 leading-relaxed text-[11px]">
                          {receiptSuccessMsg ||
                            `Your payment proof was submitted to ${businessName}. Once they confirm receipt of the funds in their bank account, your invoice will be marked as settled and your official receipt will be issued.`}
                        </p>
                        {whatsappProofUrl && (
                          <div className="pt-2">
                            <a
                              href={whatsappProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Also Send on WhatsApp</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Option 1: WhatsApp instant send */}
                        {whatsappProofUrl && (
                          <div className="p-3.5 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-2">
                            <span className="text-[11px] font-semibold text-[var(--color-text)] block">
                              Option 1: Quick Confirm via WhatsApp
                            </span>
                            <a
                              href={whatsappProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-[var(--radius-md)] transition-colors shadow-xs text-center cursor-pointer"
                            >
                              <MessageCircle className="w-4 h-4 flex-shrink-0" />
                              <span>Send Receipt / Confirm on WhatsApp</span>
                            </a>
                            <p className="text-[10px] text-[var(--color-text-muted)] text-center">
                              Opens WhatsApp with {businessName} and pre-fills your payment confirmation.
                            </p>
                          </div>
                        )}

                        {/* Option 2: Upload receipt proof on platform */}
                        <form
                          onSubmit={handleSubmitReceipt}
                          className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] border border-[var(--color-border)] space-y-3"
                        >
                          <span className="text-[11px] font-semibold text-[var(--color-text)] block">
                            Option 2: Submit Payment Receipt on Flowvo
                          </span>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
                                Sender Name / Account Name
                              </label>
                              <input
                                type="text"
                                required
                                value={senderName}
                                onChange={(e) => setSenderName(e.target.value)}
                                placeholder="Name on your bank account"
                                className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
                                Bank Transferred From
                              </label>
                              <input
                                type="text"
                                required
                                value={senderBank}
                                onChange={(e) => setSenderBank(e.target.value)}
                                placeholder="e.g. GTBank, Access, Kuda, OPay"
                                className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
                                Transfer Session ID / Ref (Optional)
                              </label>
                              <input
                                type="text"
                                value={transferRef}
                                onChange={(e) => setTransferRef(e.target.value)}
                                placeholder="Reference from bank receipt"
                                className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)] font-mono"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
                                Upload Receipt Screenshot / PDF
                              </label>
                              <label className="flex items-center gap-2 px-3 py-2 text-xs bg-[var(--color-surface-muted)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] cursor-pointer truncate">
                                <Upload className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary)]" />
                                <span className="truncate">{receiptFileName || "Choose receipt file..."}</span>
                                <input
                                  type="file"
                                  accept="image/*,application/pdf"
                                  onChange={handleReceiptFileUpload}
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-medium text-[var(--color-text-secondary)] mb-1">
                              Additional Notes (Optional)
                            </label>
                            <input
                              type="text"
                              value={transferNote}
                              onChange={(e) => setTransferNote(e.target.value)}
                              placeholder="Any note for the business owner"
                              className="w-full px-3 py-2 text-xs bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-md)] text-[var(--color-text)] focus:ring-2 focus:ring-[var(--color-primary)]"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingReceipt}
                            className="w-full py-2.5 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-bold rounded-[var(--radius-md)] transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                          >
                            {submittingReceipt ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Submitting payment receipt...</span>
                              </>
                            ) : (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Submit Receipt for Confirmation</span>
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── 2. DECLINED VIEW ──────────────────────────────────────────────────────
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

  // ─── 3. PENDING ACCEPTANCE VIEW ────────────────────────────────────────────
  return (
    <>
      <div className="space-y-3 pt-4 border-t border-[var(--color-border)]">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {showDeclineConfirm ? (
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-3">
            <p className="text-sm font-medium text-[var(--color-text)]">
              Are you sure you want to decline this quote from {businessName}?
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleDecline}
                className="px-4 py-2 text-sm font-semibold text-white bg-[var(--color-error)] hover:bg-[#a11818] rounded-[var(--radius-md)] transition-colors disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Declining..." : "Yes, decline quote"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setShowDeclineConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] rounded-[var(--radius-md)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Desktop layout */}
            <div className="hidden sm:flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setShowDeclineConfirm(true)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-error)] transition-colors cursor-pointer"
              >
                Decline quote
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={handleAccept}
                className="px-6 py-3.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-sm font-bold rounded-[var(--radius-md)] shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Accepting quote &amp; preparing payment...
                  </span>
                ) : (
                  `✅ Accept Quote · ${totalFormatted}`
                )}
              </button>
            </div>

            {/* Mobile layout */}
            <div className="sm:hidden space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleAccept}
                className="w-full py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-base font-bold rounded-[var(--radius-md)] shadow-lg transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Accepting quote...
                  </span>
                ) : (
                  `✅ Accept Quote · ${totalFormatted}`
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowDeclineConfirm(true)}
                className="w-full py-3 text-sm font-medium text-[var(--color-text-secondary)] border border-[var(--color-border)] rounded-[var(--radius-md)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
              >
                Decline quote
              </button>
            </div>
          </>
        )}

        <p className="text-[11px] text-[var(--color-text-muted)] text-center">
          By accepting, you confirm agreement to the quoted price. You can pay online immediately via Paystack or make a direct bank transfer with receipt confirmation.
        </p>
      </div>
    </>
  );
}
