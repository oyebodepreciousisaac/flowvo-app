import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { LineItem } from "@/lib/email-templates/quote-email";
import { formatAmount } from "@/lib/currency";
import { QuoteAcceptanceCard } from "./QuoteAcceptanceCard";
import { FileText, Phone, Mail, Calendar, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ quoteToken: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { quoteToken } = await params;
  const quote = await prisma.quote.findUnique({
    where: { quoteToken },
    include: { business: true },
  });

  if (!quote) return { title: "Quote — Flowvo" };

  const currency = (quote.currency || quote.business.currency || "NGN").toUpperCase();

  return {
    title: `Quote from ${quote.business.name} — ${formatAmount(quote.total, currency)}`,
  };
}

export default async function PublicQuotePage({ params }: PageProps) {
  const { quoteToken } = await params;

  const quote = await prisma.quote.findUnique({
    where: { quoteToken },
    include: {
      lead: true,
      business: true,
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
  const formattedTotal = formatAmount(quote.total, currency);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[640px] w-full mx-auto space-y-6">
        {/* Business Header Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
            <div>
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-base mb-2">
                {quote.business.name.slice(0, 2).toUpperCase()}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                {quote.business.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                <a
                  href={`mailto:${quote.business.email}`}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{quote.business.email}</span>
                </a>
                {quote.business.phone && (
                  <a
                    href={`tel:${quote.business.phone}`}
                    className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{quote.business.phone}</span>
                  </a>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="block text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)] mb-1">
                Status
              </span>
              <StatusChip status={quote.status} />
            </div>
          </div>

          {/* Quote Meta */}
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[var(--color-text-muted)] mb-0.5">Prepared For:</span>
              <span className="font-semibold text-sm text-[var(--color-text)] block">
                {quote.lead.customerName}
              </span>
              <span className="text-[var(--color-text-secondary)] block">
                {quote.lead.email}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="block text-[var(--color-text-muted)] mb-0.5">Quote Date:</span>
              <span className="font-medium text-[var(--color-text)] block">
                {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="text-[var(--color-text-muted)] block">
                Work: {quote.lead.serviceType}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)] mb-3">
              Itemized Quote
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    <th className="py-2.5 pr-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-16">Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-right w-24">Rate</th>
                    <th className="py-2.5 pl-2 font-semibold text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {lineItems.map((item, index) => (
                    <tr key={item.id || index} className="text-[var(--color-text)]">
                      <td className="py-3 pr-2 font-medium">{item.description}</td>
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
                  <tr className="border-t-2 border-[var(--color-border-strong)]">
                    <td colSpan={3} className="pt-4 pb-2 text-right text-sm font-bold text-[var(--color-text)]">
                      Total:
                    </td>
                    <td className="pt-4 pb-2 text-right text-lg font-bold font-mono text-[var(--color-primary)]">
                      {formattedTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Acceptance Action Component */}
          <div className="mt-6">
            <QuoteAcceptanceCard
              quoteToken={quote.quoteToken}
              initialStatus={quote.status}
              businessName={quote.business.name}
              totalFormatted={formattedTotal}
              acceptedAt={quote.acceptedAt?.toISOString()}
              declinedAt={quote.declinedAt?.toISOString()}
            />
          </div>
        </div>

        {/* Trust & Guarantee note */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] text-center">
          <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
          <span>Secure quote provided through Flowvo operations system.</span>
        </div>
      </div>
    </div>
  );
}
