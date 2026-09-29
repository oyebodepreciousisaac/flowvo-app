"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Building2,
  Copy,
  Check,
  ExternalLink,
  MessageCircle,
  ShieldCheck,
  Printer,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { buildCustomerPaymentProofWhatsAppUrl } from "@/lib/whatsapp";

interface CustomerInvoicePaymentCardProps {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  totalFormatted: string;
  currency: string;
  status: string;
  paidAtFormatted: string | null;
  paymentReference: string | null;
  paymentLinkUrl: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  paymentDetailsNotes: string | null;
  businessName: string;
  businessPhone: string | null;
  businessNotificationPhone: string | null;
}

export function CustomerInvoicePaymentCard({
  invoiceId,
  invoiceNumber,
  customerName,
  totalFormatted,
  currency,
  status,
  paidAtFormatted,
  paymentReference,
  paymentLinkUrl,
  bankName,
  bankAccountNumber,
  bankAccountName,
  paymentDetailsNotes,
  businessName,
  businessPhone,
  businessNotificationPhone,
}: CustomerInvoicePaymentCardProps) {
  const [activeTab, setActiveTab] = useState<"card" | "bank">(
    paymentLinkUrl ? "card" : "bank"
  );
  const [copiedAccount, setCopiedAccount] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  const isPaid = status === "PAID";
  const contactPhone = businessNotificationPhone || businessPhone || "";

  function handleCopyAccount() {
    if (!bankAccountNumber) return;
    navigator.clipboard.writeText(bankAccountNumber);
    setCopiedAccount(true);
    setTimeout(() => setCopiedAccount(false), 2500);
  }

  function handleCopyRef() {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  }

  const whatsappProofUrl = contactPhone
    ? buildCustomerPaymentProofWhatsAppUrl({
        ownerPhone: contactPhone,
        businessName,
        customerName,
        invoiceNumber,
        invoiceTotalFormatted: totalFormatted,
      })
    : null;

  if (isPaid) {
    return (
      <div className="rounded-[var(--radius-lg)] border-2 border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 p-6 md:p-8 text-center space-y-4 shadow-sm">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mb-1">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 dark:text-emerald-300">
            Payment Settled
          </span>
          <h3 className="text-2xl font-extrabold text-emerald-950 dark:text-emerald-100">
            Invoice Paid in Full
          </h3>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
            {paidAtFormatted
              ? `Confirmed on ${paidAtFormatted}`
              : "Thank you for your payment."}
          </p>
        </div>

        {paymentReference && (
          <div className="inline-block px-3 py-1 bg-white dark:bg-emerald-900/30 rounded border border-emerald-200 dark:border-emerald-800 text-xs font-mono text-emerald-900 dark:text-emerald-200">
            Receipt Ref: {paymentReference}
          </div>
        )}

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href={`/invoices/${invoiceId}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Download Official Receipt (PDF)</span>
          </Link>

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
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] overflow-hidden">
      {/* Top Header Bar */}
      <div className="px-6 py-4 bg-[var(--color-surface-muted)] border-b border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-[var(--color-text-muted)]">
            Total Amount Due
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-[var(--color-primary)] font-mono">
            {totalFormatted}
          </div>
        </div>

        {/* Tab selection if both online and manual bank exist */}
        <div className="flex items-center bg-[var(--color-surface)] p-1 rounded-[var(--radius-md)] border border-[var(--color-border)]">
          {paymentLinkUrl && (
            <button
              type="button"
              onClick={() => setActiveTab("card")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
                activeTab === "card"
                  ? "bg-[var(--color-primary)] text-white shadow-xs"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay Online</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab("bank")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-sm)] transition-colors cursor-pointer ${
              activeTab === "bank"
                ? "bg-[var(--color-primary)] text-white shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text)]"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank Transfer</span>
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Tab 1: Pay Online Securely */}
        {activeTab === "card" && paymentLinkUrl && (
          <div className="space-y-4">
            <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] border border-[var(--color-primary)]/20 text-xs text-[var(--color-text)] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--color-primary)]">
                <ShieldCheck className="w-4 h-4" />
                <span>Instant &amp; Verified Payment</span>
              </div>
              <p className="text-[var(--color-text-secondary)] leading-relaxed">
                Pay directly using Debit/Credit Card, Bank App Transfer, USSD, or Apple Pay.
                Your receipt will be generated automatically upon completion.
              </p>
            </div>

            <a
              href={paymentLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2.5 px-6 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-base font-bold rounded-[var(--radius-md)] transition-colors shadow-md text-center cursor-pointer"
            >
              <CreditCard className="w-5 h-5 flex-shrink-0" />
              <span>Pay {totalFormatted} Online Now</span>
              <ExternalLink className="w-4 h-4 opacity-75" />
            </a>

            <div className="flex items-center justify-center gap-4 text-[11px] text-[var(--color-text-muted)] pt-1">
              <span>🔒 256-bit SSL Encrypted</span>
              <span>•</span>
              <span>Instant Verification</span>
              <span>•</span>
              <span>Official Receipt</span>
            </div>
          </div>
        )}

        {/* Tab 2: Direct Bank Transfer */}
        {(activeTab === "bank" || !paymentLinkUrl) && (
          <div className="space-y-5">
            <div className="text-xs text-[var(--color-text-secondary)]">
              Transfer exactly <strong>{totalFormatted}</strong> to the verified business account below:
            </div>

            {bankAccountNumber ? (
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] space-y-3.5 font-mono text-xs">
                {/* Bank Name */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                    Bank Name
                  </span>
                  <span className="font-bold text-[var(--color-text)] text-sm">
                    {bankName || "Official Settlement Bank"}
                  </span>
                </div>

                {/* Account Number with 1-Click Copy */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[var(--color-border)]">
                  <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                    Account Number
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-extrabold text-[var(--color-primary)] tracking-wider">
                      {bankAccountNumber}
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
                {bankAccountName && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2.5 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">
                      Account Name
                    </span>
                    <span className="font-semibold text-[var(--color-text)]">
                      {bankAccountName}
                    </span>
                  </div>
                )}

                {/* Payment Reference */}
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
                      title="Copy invoice number reference"
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
            ) : paymentDetailsNotes ? (
              <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] text-xs font-mono whitespace-pre-wrap text-[var(--color-text)] leading-relaxed">
                {paymentDetailsNotes}
              </div>
            ) : (
              <div className="p-4 rounded-[var(--radius-md)] bg-amber-50 border border-amber-200 text-xs text-amber-900">
                Please contact {businessName} directly for bank settlement instructions.
              </div>
            )}

            {/* Step 2: Confirm on WhatsApp */}
            {whatsappProofUrl && (
              <div className="pt-2 space-y-2">
                <span className="text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider block">
                  After Transferring:
                </span>
                <a
                  href={whatsappProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold rounded-[var(--radius-md)] transition-colors shadow-sm text-center cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  <span>I Have Made This Transfer (Confirm on WhatsApp)</span>
                </a>
                <p className="text-[11px] text-[var(--color-text-muted)] text-center">
                  Opens WhatsApp with {businessName} and pre-fills your payment confirmation.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
