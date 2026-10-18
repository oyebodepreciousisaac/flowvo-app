import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { formatAmount, convertCurrency } from "@/lib/currency";
import { LineItem } from "@/lib/email-templates/quote-email";
import { decryptField } from "@/lib/security";
import { parseBusinessBankDetails } from "@/lib/bank-details";
import { InvoiceDetailActions } from "./InvoiceDetailActions";
import { ArrowLeft, Mail, Calendar, Briefcase, FileText, Globe, ExternalLink, Printer } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) return { title: "Invoice Details — Flowvo" };

  const invoice = await prisma.invoice.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { invoiceNumber: true, customerName: true },
  });

  return {
    title: invoice
      ? `Invoice ${invoice.invoiceNumber} — ${invoice.customerName} — Flowvo`
      : "Invoice Details — Flowvo",
  };
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      business: true,
      lead: true,
      job: true,
      quote: true,
      activityLogs: {
        orderBy: { occurredAt: "desc" },
      },
    },
  });

  if (!invoice) {
    notFound();
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
  const dueDateFormatted = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const issueDateFormatted = new Date(invoice.createdAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const issueTimeFormatted = new Date(invoice.createdAt).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const bankDetails = parseBusinessBankDetails(invoice.business);

  return (
    <div className="space-y-6">
      {/* Back button & quick print */}
      <div className="flex items-center justify-between">
        <Link
          href="/invoices"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Invoices</span>
        </Link>

        <Link
          href={`/invoices/${invoice.id}/print`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Open Printable Invoice</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div
        className={`bg-[var(--color-surface)] border rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4 ${
          invoice.status === "OVERDUE"
            ? "border-l-4 border-l-[var(--color-error)] border-[var(--color-border)]"
            : "border-[var(--color-border)]"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] px-2.5 py-0.5 rounded border border-[var(--color-border)]">
                {invoice.invoiceNumber}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--color-text)]">
                {invoice.customerName}
              </h1>
              <StatusChip status={invoice.status} />
              {invoice.status === "SENT" && (
                <span
                  className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    invoice.emailDeliveryStatus === "BOUNCED"
                      ? "bg-[var(--color-status-overdue)] text-[var(--color-error)] border-[#f8b4b4]"
                      : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-[var(--color-border)]"
                  }`}
                >
                  Delivery: {invoice.emailDeliveryStatus}
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2.5 sm:gap-4 text-[11px] sm:text-xs text-[var(--color-text-secondary)]">
              <div className="flex items-center gap-1.5 min-w-0">
                <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-none">{invoice.customerEmail}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                <span>Due: {dueDateFormatted}</span>
              </div>
              {invoice.job && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <Briefcase className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <Link
                    href={`/jobs/${invoice.jobId}`}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    View Job
                  </Link>
                </div>
              )}
              {invoice.quote && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <FileText className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <Link
                    href={`/quotes/${invoice.quoteId}`}
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    View Quote
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]">
            <span className="block text-xs uppercase font-semibold text-[var(--color-text-muted)]">
              Total Due ({currency})
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold text-[var(--color-primary)]">
              {totalFormatted}
            </span>
            {invoice.business.currency && invoice.business.currency.toUpperCase() !== currency && (
              <span className="block text-[11px] sm:text-xs text-[var(--color-text-secondary)] font-mono font-semibold mt-0.5">
                ≈ {formatAmount(convertCurrency(invoice.total, currency, invoice.business.currency), invoice.business.currency)}
              </span>
            )}
            {invoice.paidAt && (
              <span className="block text-[11px] sm:text-xs text-[var(--color-primary)] font-medium mt-0.5">
                Paid on {new Date(invoice.paidAt).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <InvoiceDetailActions
            invoiceId={invoice.id}
            invoiceNumber={invoice.invoiceNumber}
            customerName={invoice.customerName}
            customerEmail={invoice.customerEmail}
            customerPhone={invoice.lead?.phone || invoice.job?.customerPhone || null}
            businessName={invoice.business.name}
            totalFormatted={totalFormatted}
            currentStatus={invoice.status}
            emailDeliveryStatus={invoice.emailDeliveryStatus}
            dueDateFormatted={dueDateFormatted}
            paymentLinkUrl={invoice.paymentLinkUrl}
            businessCurrency={invoice.business.currency || "NGN"}
            invoiceCurrency={currency}
            invoiceTotalPence={invoice.total}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items & Bank Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Itemized Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                    <th className="py-2 pr-4">Description</th>
                    <th className="py-2 px-4 text-center">Qty</th>
                    <th className="py-2 px-4 text-right">Unit Rate</th>
                    <th className="py-2 pl-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)] text-xs">
                  {lineItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[var(--color-surface-muted)] transition-colors">
                      <td className="py-3 pr-4 font-medium text-[var(--color-text)]">
                        {item.description}
                      </td>
                      <td className="py-3 px-4 text-center text-[var(--color-text-secondary)]">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-[var(--color-text-secondary)]">
                        {formatAmount(item.unitPricePence, currency)}
                      </td>
                      <td className="py-3 pl-4 text-right font-mono font-semibold text-[var(--color-text)]">
                        {formatAmount(item.lineTotalPence, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--color-border)] text-sm font-semibold">
                    <td colSpan={3} className="py-3 pr-4 text-right text-[var(--color-text-secondary)]">
                      Subtotal
                    </td>
                    <td className="py-3 pl-4 text-right font-mono text-[var(--color-text)]">
                      {subtotalFormatted}
                    </td>
                  </tr>
                  <tr className="text-sm font-bold">
                    <td colSpan={3} className="py-2 pr-4 text-right text-[var(--color-text)]">
                      Total Due
                    </td>
                    <td className="py-2 pl-4 text-right font-mono text-base text-[var(--color-primary)]">
                      {totalFormatted}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Payment Instructions Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
            <h2 className="text-base font-semibold text-[var(--color-text)]">Direct Bank Payment Instructions</h2>
            {bankDetails.hasDetails ? (
              <div className="space-y-3">
                {bankDetails.accountNumber ? (
                  <div className="p-4 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs space-y-2 font-mono">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-1.5 border-b border-[var(--color-border)] min-w-0">
                      <span className="shrink-0 text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">Bank</span>
                      <span className="font-bold text-[var(--color-text)] sm:text-right break-words min-w-0">{bankDetails.bankName || "Official Settlement Bank"}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-1.5 border-b border-[var(--color-border)] min-w-0">
                      <span className="shrink-0 text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">Account Number</span>
                      <span className="font-bold text-[var(--color-primary)] text-sm tracking-wider sm:text-right shrink-0">{bankDetails.accountNumber}</span>
                    </div>
                    {bankDetails.accountName && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-1.5 border-b border-[var(--color-border)] min-w-0">
                        <span className="shrink-0 text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">Account Name</span>
                        <span className="font-medium text-[var(--color-text)] sm:text-right break-words min-w-0">{bankDetails.accountName}</span>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4 py-1.5 min-w-0">
                      <span className="shrink-0 text-[var(--color-text-muted)] font-sans uppercase text-[10px] tracking-wider font-semibold">Payment Reference</span>
                      <span className="font-bold text-[var(--color-text)] sm:text-right shrink-0">{invoice.invoiceNumber}</span>
                    </div>
                  </div>
                ) : null}

                {bankDetails.notes && (
                  <div className="p-3.5 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] leading-relaxed break-words overflow-hidden">
                    <span className="block font-semibold text-[10px] uppercase tracking-wider text-[var(--color-text-muted)] mb-1">Payment Instructions</span>
                    <p className="whitespace-pre-wrap">{bankDetails.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-[var(--color-status-action)] text-[#8C5A00] rounded-[var(--radius-md)] border border-[#edd7a6] text-xs">
                <span>No bank payment details configured. </span>
                <Link href="/settings" className="font-semibold underline hover:text-[var(--color-text)]">
                  Add payment details in Settings
                </Link>{" "}
                so customers receive transfer details on invoices.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Activity History */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Invoice Summary
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                <span className="shrink-0 text-[var(--color-text-secondary)]">Invoice Number</span>
                <span className="font-mono font-semibold text-[var(--color-text)] truncate text-right">
                  {invoice.invoiceNumber}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                <span className="shrink-0 text-[var(--color-text-secondary)]">Issue Date</span>
                <span className="text-[var(--color-text)] font-medium text-right truncate">
                  {issueDateFormatted}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                <span className="shrink-0 text-[var(--color-text-secondary)]">Currency</span>
                <span className="font-mono font-semibold text-[var(--color-text)] text-right">
                  {currency}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                <span className="shrink-0 text-[var(--color-text-secondary)]">Payment Due</span>
                <span className="font-medium text-[var(--color-text)] text-right truncate">
                  {dueDateFormatted}
                </span>
              </div>
              {invoice.sentAt && (
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                  <span className="shrink-0 text-[var(--color-text-secondary)]">Sent Date</span>
                  <span className="text-[var(--color-text)] text-right truncate">
                    {new Date(invoice.sentAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              )}
              {invoice.paidAt && (
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                  <span className="shrink-0 text-[var(--color-text-secondary)]">Paid Date</span>
                  <span className="font-semibold text-[var(--color-primary)] text-right truncate">
                    {new Date(invoice.paidAt).toLocaleDateString("en-GB")}
                  </span>
                </div>
              )}
              {invoice.paymentReference && (
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-[var(--color-border)] min-w-0">
                  <span className="shrink-0 text-[var(--color-text-secondary)]">Gateway Reference</span>
                  <span className="font-mono text-[var(--color-text)] text-[11px] truncate max-w-[140px] text-right" title={invoice.paymentReference}>
                    {invoice.paymentReference}
                  </span>
                </div>
              )}
            </div>

            {/* Online payment link card in sidebar if exists */}
            {invoice.paymentLinkUrl && (
              <div className="pt-2">
                <div className="p-3 bg-[var(--color-primary-subtle)] rounded-[var(--radius-md)] border border-[var(--color-primary)]/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Customer Payment Portal</span>
                  </div>
                  <a
                    href={invoice.paymentLinkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-mono text-[var(--color-primary)] hover:underline break-all"
                  >
                    <span>Open Payment Link</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Activity History
            </h3>
            <ActivityTimeline logs={invoice.activityLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}
