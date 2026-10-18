import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatAmount, calculateMultiCurrencyTotals, convertCurrency } from "@/lib/currency";
import { FileText, ArrowRight, AlertTriangle, CheckCircle2, Calendar, MessageCircle, Coins } from "lucide-react";
import { buildInvoicePaymentReminderWhatsAppUrl } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Invoices — Settlevo" };

export default async function InvoicesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
    select: { currency: true, name: true, phone: true, notificationPhone: true },
  });
  const businessCurrency = business?.currency || "NGN";
  const businessName = business?.name || "Settlevo Business";

  const allInvoices = await prisma.invoice.findMany({
    where: { businessId: session.user.businessId },
    include: {
      lead: { select: { phone: true } },
      job: { select: { customerPhone: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Urgency ordering per Build Plan: OVERDUE first, then SENT by dueDate, then DRAFT, then PAID
  const overdueInvoices = allInvoices
    .filter((inv) => inv.status === "OVERDUE")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const sentInvoices = allInvoices
    .filter((inv) => inv.status === "SENT")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const draftInvoices = allInvoices
    .filter((inv) => inv.status === "DRAFT")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const paidInvoices = allInvoices
    .filter((inv) => inv.status === "PAID")
    .sort((a, b) => {
      const aTime = a.paidAt ? new Date(a.paidAt).getTime() : 0;
      const bTime = b.paidAt ? new Date(b.paidAt).getTime() : 0;
      return bTime - aTime;
    });

  const sortedInvoices = [
    ...overdueInvoices,
    ...sentInvoices,
    ...draftInvoices,
    ...paidInvoices,
  ];

  // Metric sums normalized to business base currency
  const overdueMetrics = calculateMultiCurrencyTotals(overdueInvoices, businessCurrency);
  const outstandingInvoices = [...overdueInvoices, ...sentInvoices, ...draftInvoices];
  const outstandingMetrics = calculateMultiCurrencyTotals(outstandingInvoices, businessCurrency);
  const paidMetrics = calculateMultiCurrencyTotals(paidInvoices, businessCurrency);

  return (
    <div className="space-y-6">
      {/* Header & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
              Invoices
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {allInvoices.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Auto-drafted upon job completion. Review, email, and track payment receipts.
          </p>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-[var(--color-text-muted)]">
              Outstanding Balance
            </span>
            <div className="mt-1 font-mono text-xl font-bold text-[var(--color-text)]">
              {formatAmount(outstandingMetrics.convertedTotal, businessCurrency)}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <span className="text-[11px] text-[var(--color-text-muted)] block">
              {sentInvoices.length + draftInvoices.length} active invoices
            </span>
            {outstandingMetrics.hasMultipleCurrencies && (
              <div className="text-[10px] text-[var(--color-text-secondary)] font-mono flex items-center gap-1 flex-wrap pt-1 border-t border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)]">Breakdown:</span>
                {outstandingMetrics.currencies.map((c) => (
                  <span
                    key={c}
                    className="bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)] font-semibold"
                  >
                    {formatAmount(outstandingMetrics.byCurrency[c], c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          className={`bg-[var(--color-surface)] border rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] flex flex-col justify-between ${
            overdueInvoices.length > 0
              ? "border-l-4 border-l-[var(--color-error)] border-[var(--color-border)]"
              : "border-[var(--color-border)]"
          }`}
        >
          <div>
            <span className="text-xs uppercase font-semibold text-[var(--color-error)] flex items-center gap-1.5">
              {overdueInvoices.length > 0 && <AlertTriangle className="w-3.5 h-3.5" />}
              Overdue
            </span>
            <div className="mt-1 font-mono text-xl font-bold text-[var(--color-error)]">
              {formatAmount(overdueMetrics.convertedTotal, businessCurrency)}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <span className="text-[11px] text-[var(--color-error)] block">
              {overdueInvoices.length} past due
            </span>
            {overdueMetrics.hasMultipleCurrencies && (
              <div className="text-[10px] text-[var(--color-error)] font-mono flex items-center gap-1 flex-wrap pt-1 border-t border-[var(--color-border)]">
                <span className="opacity-80">Breakdown:</span>
                {overdueMetrics.currencies.map((c) => (
                  <span
                    key={c}
                    className="bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)] font-semibold"
                  >
                    {formatAmount(overdueMetrics.byCurrency[c], c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase font-semibold text-[var(--color-primary)] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Paid to Date
            </span>
            <div className="mt-1 font-mono text-xl font-bold text-[var(--color-primary)]">
              {formatAmount(paidMetrics.convertedTotal, businessCurrency)}
            </div>
          </div>
          <div className="mt-2 space-y-1">
            <span className="text-[11px] text-[var(--color-text-muted)] block">
              {paidInvoices.length} completed payments
            </span>
            {paidMetrics.hasMultipleCurrencies && (
              <div className="text-[10px] text-[var(--color-text-secondary)] font-mono flex items-center gap-1 flex-wrap pt-1 border-t border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)]">Breakdown:</span>
                {paidMetrics.currencies.map((c) => (
                  <span
                    key={c}
                    className="bg-[var(--color-surface-muted)] px-1.5 py-0.5 rounded border border-[var(--color-border)] font-semibold"
                  >
                    {formatAmount(paidMetrics.byCurrency[c], c)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content: Empty State or Invoices List */}
      {sortedInvoices.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-xl mx-auto my-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No invoices yet</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
            When you complete a job, an invoice draft is automatically generated for your review and approval.
          </p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-md)] text-sm font-semibold transition-colors shadow-sm"
          >
            <span>View jobs</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedInvoices.map((invoice) => {
            const isOverdue = invoice.status === "OVERDUE";
            const isDraft = invoice.status === "DRAFT";
            const isSent = invoice.status === "SENT";
            const dueDateStr = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });

            const customerPhone = invoice.lead?.phone || invoice.job?.customerPhone || null;
            const reminderUrl = customerPhone
              ? buildInvoicePaymentReminderWhatsAppUrl({
                  customerPhone,
                  customerName: invoice.customerName,
                  businessName,
                  invoiceNumber: invoice.invoiceNumber,
                  invoiceTotalFormatted: formatAmount(invoice.total, invoice.currency || businessCurrency),
                  dueDateFormatted: dueDateStr,
                  invoiceUrl: `/invoices/view/${invoice.id}`,
                  isOverdue,
                })
              : null;

            return (
              <div
                key={invoice.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[var(--radius-md)] border bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-md ${
                  isOverdue
                    ? "border-l-4 border-l-[var(--color-error)] border-[var(--color-border)]"
                    : "border-[var(--color-border)]"
                }`}
              >
                {/* Left: Invoice Number, Customer, Due Date */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] px-1.5 sm:px-2 py-0.5 rounded border border-[var(--color-border)] shrink-0">
                      {invoice.invoiceNumber}
                    </span>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-sm sm:text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none"
                    >
                      {invoice.customerName}
                    </Link>
                    <StatusChip status={invoice.status} />
                    {isSent && invoice.emailDeliveryStatus === "BOUNCED" && (
                      <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--color-status-overdue)] text-[var(--color-error)] border border-[#f8b4b4] shrink-0">
                        Bounced
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-[var(--color-text-secondary)] flex-wrap">
                    <span className="truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none">{invoice.customerEmail}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className={isOverdue ? "text-[var(--color-error)] font-medium" : ""}>
                        Due: {dueDateStr}
                      </span>
                    </span>
                    {invoice.paidAt && (
                      <span className="text-[var(--color-primary)] font-medium shrink-0">
                        Paid: {new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Action Link */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-base sm:text-lg font-bold text-[var(--color-text)] block">
                      {formatAmount(invoice.total, invoice.currency || businessCurrency)}
                    </span>
                    {invoice.currency && invoice.currency.toUpperCase() !== businessCurrency.toUpperCase() && (
                      <span className="text-[10px] sm:text-[11px] text-[var(--color-primary)] font-mono font-semibold block">
                        ≈ {formatAmount(convertCurrency(invoice.total, invoice.currency, businessCurrency), businessCurrency)}
                      </span>
                    )}
                    <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] block">
                      {isDraft ? "Draft" : isSent ? "Awaiting payment" : isOverdue ? "Past due" : "Paid"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {reminderUrl && (isOverdue || isSent) && (
                      <a
                        href={reminderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-[var(--radius-md)] text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs"
                        title="Send 1-click WhatsApp payment reminder to customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    <Link
                      href={`/invoices/${invoice.id}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-[var(--radius-md)] text-xs font-semibold transition-colors shadow-sm ${
                        isDraft
                          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                          : isOverdue || isSent
                          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                          : "bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      <span>
                        <span className="sm:hidden">{isDraft ? "Review" : isOverdue || isSent ? "Manage" : "View"}</span>
                        <span className="hidden sm:inline">{isDraft ? "Review & send" : isOverdue || isSent ? "Manage & pay" : "View"}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
