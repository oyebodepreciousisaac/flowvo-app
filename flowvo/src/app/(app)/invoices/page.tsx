import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount, calculateMultiCurrencyTotals } from "@/lib/currency";
import { InvoicesView, type InvoiceItemData } from "./InvoicesView";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

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
    take: 500,
  });

  // Urgency ordering: OVERDUE first, then SENT by dueDate, then DRAFT, then PAID
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

  const serializedInvoices: InvoiceItemData[] = sortedInvoices.map((inv) => ({
    id: inv.id,
    invoiceNumber: inv.invoiceNumber,
    customerName: inv.customerName,
    customerEmail: inv.customerEmail,
    total: inv.total,
    currency: inv.currency || businessCurrency,
    status: inv.status,
    dueDate: inv.dueDate.toISOString(),
    sentAt: inv.sentAt ? inv.sentAt.toISOString() : null,
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
    createdAt: inv.createdAt.toISOString(),
    emailDeliveryStatus: inv.emailDeliveryStatus,
    customerPhone: inv.lead?.phone || inv.job?.customerPhone || null,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
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
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-[var(--shadow-card)] flex flex-col justify-between">
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
          className={`bg-[var(--color-surface)] border rounded-xl p-4 shadow-[var(--shadow-card)] flex flex-col justify-between ${
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

        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 shadow-[var(--shadow-card)] flex flex-col justify-between">
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

      {/* Interactive Invoices View with Live Search & Category Filtering */}
      <InvoicesView
        initialInvoices={serializedInvoices}
        businessCurrency={businessCurrency}
        businessName={businessName}
      />
    </div>
  );
}
