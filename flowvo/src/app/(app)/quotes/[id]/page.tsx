import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { LineItem } from "@/lib/email-templates/quote-email";
import { formatAmount, getCurrencySymbol } from "@/lib/currency";
import { QuoteDetailActions } from "./QuoteDetailActions";
import { ArrowLeft, Clock, Mail, Phone } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) return { title: "Quote Details — Flowvo" };

  const quote = await prisma.quote.findFirst({
    where: { id, businessId: session.user.businessId },
    include: { lead: true },
  });

  return {
    title: quote ? `Quote: ${quote.lead.customerName} — Flowvo` : "Quote Details — Flowvo",
  };
}

export default async function QuoteDetailPage({ params }: PageProps) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const quote = await prisma.quote.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      lead: true,
      business: true,
      activityLogs: {
        orderBy: { occurredAt: "desc" },
      },
    },
  });

  if (!quote) {
    notFound();
  }

  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(quote.lineItems);
  } catch {
    lineItems = [];
  }

  const currency = (quote.currency || quote.business.currency || "NGN").toUpperCase();
  const currencySymbol = getCurrencySymbol(currency);
  const totalFormatted = formatAmount(quote.total, currency);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/quotes"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Quotes</span>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                Quote for {quote.lead.customerName}
              </h1>
              <StatusChip status={quote.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {quote.lead.serviceType} · Created on{" "}
              {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>

          <div className="text-right">
            <span className="block text-xs uppercase font-semibold text-[var(--color-text-muted)]">
              Quote Total
            </span>
            <span className="font-mono text-2xl font-bold text-[var(--color-primary)]">
              {totalFormatted}
            </span>
          </div>
        </div>

        {/* Action strip */}
        <QuoteDetailActions
          quoteId={quote.id}
          quoteToken={quote.quoteToken}
          customerName={quote.lead.customerName}
          customerEmail={quote.lead.email}
          customerPhone={quote.lead.phone}
          businessName={quote.business.name}
          totalFormatted={totalFormatted}
          currentStatus={quote.status}
        />
      </div>

      {/* Two Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items & Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Itemized Table Card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4">
              Itemized Quote
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    <th className="py-2.5 pr-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-16">Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-right w-24">Unit ({currencySymbol})</th>
                    <th className="py-2.5 pl-2 font-semibold text-right w-24">Total ({currencySymbol})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {lineItems.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 pr-2 font-medium text-[var(--color-text)]">
                        {item.description}
                      </td>
                      <td className="py-3 px-2 text-center text-[var(--color-text-secondary)]">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[var(--color-text-secondary)]">
                        {formatAmount(item.unitPricePence, currency)}
                      </td>
                      <td className="py-3 pl-2 text-right font-mono font-semibold text-[var(--color-text)]">
                        {formatAmount(item.lineTotalPence, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-[var(--color-border-strong)]">
                    <td colSpan={3} className="pt-4 pb-1 text-right text-xs text-[var(--color-text-secondary)]">
                      Subtotal:
                    </td>
                    <td className="pt-4 pb-1 text-right font-mono font-semibold text-xs text-[var(--color-text)]">
                      {formatAmount(quote.subtotal, currency)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={3} className="py-1 text-right text-sm font-bold text-[var(--color-text)]">
                      Total:
                    </td>
                    <td className="py-1 text-right font-mono font-bold text-base text-[var(--color-primary)]">
                      {totalFormatted}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Customer info card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)] space-y-3">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)]">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="block text-[var(--color-text-muted)] mb-0.5">Name</span>
                <Link
                  href={`/leads/${quote.leadId}`}
                  className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                >
                  {quote.lead.customerName}
                </Link>
              </div>
              <div>
                <span className="block text-[var(--color-text-muted)] mb-0.5">Email</span>
                <a
                  href={`mailto:${quote.lead.email}`}
                  className="inline-flex items-center gap-1 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{quote.lead.email}</span>
                </a>
              </div>
              <div>
                <span className="block text-[var(--color-text-muted)] mb-0.5">Phone</span>
                <a
                  href={`tel:${quote.lead.phone}`}
                  className="inline-flex items-center gap-1 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)]"
                >
                  <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{quote.lead.phone}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Activity Timeline</span>
              <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
            </h2>

            <ActivityTimeline logs={quote.activityLogs} />
          </div>
        </div>
      </div>
    </div>
  );
}
