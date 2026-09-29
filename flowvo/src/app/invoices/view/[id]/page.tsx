import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { decryptField } from "@/lib/security";
import { formatAmount } from "@/lib/currency";
import { LineItem } from "@/lib/email-templates/quote-email";
import { StatusChip } from "@/components/ui/StatusChip";
import { CustomerInvoicePaymentCard } from "./CustomerInvoicePaymentCard";
import {
  Printer,
  Mail,
  Phone,
  Calendar,
  Building2,
  FileText,
  MapPin,
  Clock,
  ShieldCheck,
} from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ paid?: string; canceled?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: { business: true },
  });

  if (!invoice) return { title: "Invoice — Flowvo" };

  const currency = (invoice.currency || invoice.business.currency || "NGN").toUpperCase();
  return {
    title: `Invoice ${invoice.invoiceNumber} from ${invoice.business.name} — ${formatAmount(invoice.total, currency)}`,
  };
}

export default async function PublicInvoiceViewPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const search = searchParams ? await searchParams : {};
  const isPaidReturn = search.paid === "true";

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      business: true,
      lead: true,
      job: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  // If returning from successful online payment gateway and not yet marked paid in DB, update idempotently
  let effectiveStatus = invoice.status;
  let effectivePaidAt = invoice.paidAt;

  if (isPaidReturn && invoice.status !== "PAID") {
    try {
      const updated = await prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          status: "PAID",
          paidAt: new Date(),
        },
      });
      effectiveStatus = updated.status;
      effectivePaidAt = updated.paidAt;

      // Log activity
      await prisma.activityLog.create({
        data: {
          businessId: invoice.businessId,
          invoiceId: invoice.id,
          entityType: "invoice",
          entityId: invoice.id,
          eventType: "invoice.paid",
          detail: `Invoice ${invoice.invoiceNumber} marked PAID via online payment return.`,
        },
      });
    } catch {
      // Continue with current state if concurrent update happened
    }
  }

  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(invoice.lineItems);
  } catch {
    lineItems = [];
  }

  const currency = (invoice.currency || invoice.business.currency || "NGN").toUpperCase();
  const totalFormatted = formatAmount(invoice.total, currency);
  const subtotalFormatted = formatAmount(invoice.subtotal, currency);

  const issueDateFormatted = new Date(invoice.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const issueTimeFormatted = new Date(invoice.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const paidAtFormatted = effectivePaidAt
    ? `${new Date(effectivePaidAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} at ${new Date(effectivePaidAt).toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })}`
    : null;

  const decryptedPaymentDetails = decryptField(invoice.business.paymentDetails);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-8 md:py-14 px-4 sm:px-6 lg:px-8 text-[var(--color-text)]">
      <div className="max-w-[760px] w-full mx-auto space-y-6">
        
        {/* Top Floating Helper Actions */}
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[var(--color-primary)]">Official Document</span>
            <span>•</span>
            <span className="font-mono">#{invoice.invoiceNumber}</span>
          </div>

          <Link
            href={`/invoices/${invoice.id}/print`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] font-medium transition-colors shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" />
            <span>Print / PDF</span>
          </Link>
        </div>

        {/* Main Document Body */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] shadow-[var(--shadow-raised)] p-6 md:p-10 space-y-8">
          
          {/* Business & Invoice Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-[var(--color-border)]">
            <div className="space-y-3">
              {/* Business Logo or Stylish Initial Icon */}
              {invoice.business.logoUrl ? (
                <div className="mb-2">
                  <img
                    src={invoice.business.logoUrl}
                    alt={invoice.business.name}
                    className="h-12 sm:h-14 w-auto max-w-[220px] object-contain"
                  />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-lg mb-1 shadow-2xs">
                  {invoice.business.name.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
                  {invoice.business.name}
                </h1>
                <div className="mt-1 space-y-0.5 text-xs text-[var(--color-text-secondary)]">
                  {invoice.business.address && (
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                      <span>{invoice.business.address}</span>
                    </p>
                  )}
                  {invoice.business.email && (
                    <p className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                      <a href={`mailto:${invoice.business.email}`} className="hover:underline">
                        {invoice.business.email}
                      </a>
                    </p>
                  )}
                  {invoice.business.phone && (
                    <p className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)] flex-shrink-0" />
                      <a href={`tel:${invoice.business.phone}`} className="hover:underline">
                        {invoice.business.phone}
                      </a>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Invoice Meta */}
            <div className="sm:text-right space-y-2 w-full sm:w-auto">
              <div className="inline-block sm:block">
                <StatusChip status={effectiveStatus} />
              </div>
              <div className="space-y-1 text-xs">
                <div className="font-mono text-sm font-bold text-[var(--color-text)]">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-[var(--color-text-secondary)]">
                  Issued: {issueDateFormatted}
                </div>
                <div className="text-[var(--color-text-secondary)]">
                  Due: <span className="font-semibold text-[var(--color-text)]">{dueDateFormatted}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To Customer Card */}
          <div className="p-4 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block mb-0.5">
                Billed To
              </span>
              <span className="text-sm font-bold text-[var(--color-text)] block">
                {invoice.customerName}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[var(--color-text-secondary)]">
              {invoice.customerEmail && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{invoice.customerEmail}</span>
                </span>
              )}
              {(invoice.lead?.phone || invoice.job?.customerPhone) && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{invoice.lead?.phone || invoice.job?.customerPhone}</span>
                </span>
              )}
            </div>
          </div>

          {/* Itemized Line Items Table */}
          <div className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Itemized Breakdown
            </h2>

            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto border border-[var(--color-border)] rounded-[var(--radius-md)]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--color-surface-muted)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-secondary)] border-b border-[var(--color-border)]">
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Rate</th>
                    <th className="py-2.5 px-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-muted)]/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-[var(--color-text)]">
                        {item.description}
                      </td>
                      <td className="py-3 px-3 text-center text-[var(--color-text-secondary)]">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-[var(--color-text-secondary)]">
                        {formatAmount(item.unitPricePence, currency)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-[var(--color-text)]">
                        {formatAmount(item.lineTotalPence, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Items View */}
            <div className="sm:hidden space-y-2.5">
              {lineItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-muted)]/40 flex justify-between items-start gap-3"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-xs text-[var(--color-text)]">
                      {item.description}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-muted)] font-mono">
                      {item.quantity} × {formatAmount(item.unitPricePence, currency)}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-sm text-[var(--color-text)] text-right">
                    {formatAmount(item.lineTotalPence, currency)}
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Summary Box */}
            <div className="pt-3 border-t border-[var(--color-border)] flex flex-col items-end gap-1.5 text-xs">
              <div className="flex justify-between w-full max-w-[240px]">
                <span className="text-[var(--color-text-secondary)]">Subtotal:</span>
                <span className="font-mono font-semibold text-[var(--color-text)]">
                  {subtotalFormatted}
                </span>
              </div>
              <div className="flex justify-between w-full max-w-[240px] pt-1.5 border-t border-[var(--color-border)] text-sm sm:text-base font-extrabold">
                <span className="text-[var(--color-text)]">Total Due:</span>
                <span className="font-mono text-[var(--color-primary)]">
                  {totalFormatted}
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Checkout Section (The Core Receiver Experience) */}
          <div className="pt-2">
            <CustomerInvoicePaymentCard
              invoiceId={invoice.id}
              invoiceNumber={invoice.invoiceNumber}
              customerName={invoice.customerName}
              totalFormatted={totalFormatted}
              currency={currency}
              status={effectiveStatus}
              paidAtFormatted={paidAtFormatted}
              paymentReference={invoice.paymentReference}
              paymentLinkUrl={invoice.paymentLinkUrl}
              bankName={invoice.business.bankName}
              bankAccountNumber={invoice.business.bankAccountNumber}
              bankAccountName={invoice.business.bankAccountName}
              paymentDetailsNotes={decryptedPaymentDetails}
              businessName={invoice.business.name}
              businessPhone={invoice.business.phone}
              businessNotificationPhone={invoice.business.notificationPhone}
            />
          </div>

        </div>

        {/* Footer */}
        <div className="text-center text-xs text-[var(--color-text-muted)] py-4">
          <p>Powered by Flowvo • Secure &amp; Verified Invoice System</p>
        </div>

      </div>
    </div>
  );
}
