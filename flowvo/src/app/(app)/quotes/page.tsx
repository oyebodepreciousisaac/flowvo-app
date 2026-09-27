import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatPence } from "@/lib/email-templates/quote-email";
import { FileText, ArrowRight, Briefcase, Plus, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Quotes — Flowvo" };

export default async function QuotesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const quotes = await prisma.quote.findMany({
    where: { businessId: session.user.businessId },
    include: {
      lead: true,
      jobs: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Quotes</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {quotes.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Itemized quotes sent to customers with automated 3-day reminders.
          </p>
        </div>

        <div>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New quote</span>
          </Link>
        </div>
      </div>

      {/* Main content: Empty state or Quotes grid */}
      {quotes.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-xl mx-auto my-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mb-4">
            <FileText className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No quotes yet</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
            Open a lead and create an itemized quote from there. All customer details will be pre-filled automatically.
          </p>
          <Link
            href="/leads"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-md)] text-sm font-semibold transition-colors shadow-sm"
          >
            <span>Go to Leads</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quotes.map((quote) => {
            const isDraft = quote.status === "DRAFT";
            const isSent = quote.status === "SENT";
            const isAccepted = quote.status === "ACCEPTED";
            const isDeclined = quote.status === "DECLINED";

            return (
              <div
                key={quote.id}
                className="flex flex-col justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5 transition-shadow hover:shadow-md"
              >
                <div>
                  {/* Top row: Status chip & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusChip status={quote.status} />
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>

                  {/* Customer Name & Link */}
                  <Link href={`/quotes/${quote.id}`} className="group block">
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">
                      {quote.lead.customerName}
                    </h3>
                  </Link>

                  {/* Service type */}
                  <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {quote.lead.serviceType}
                  </div>

                  {/* Quote Total */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">Total:</span>
                    <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                      {formatPence(quote.total)}
                    </span>
                  </div>

                  {/* Follow-up status note if sent */}
                  {isSent && (
                    <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                      {quote.followUpSentAt ? (
                        <span className="text-[var(--color-text-secondary)]">
                          Follow-up sent on{" "}
                          {new Date(quote.followUpSentAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      ) : (
                        <span>Automated follow-up scheduled in 3 days</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Primary Action Button Per Status */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View details
                  </Link>

                  {isDraft && (
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors"
                    >
                      <span>Review & send</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {isSent && (
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors"
                    >
                      <span>View quote</span>
                    </Link>
                  )}

                  {isAccepted && (
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] hover:bg-[#d6ece7] text-[var(--color-primary)] transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>View job</span>
                    </Link>
                  )}

                  {isDeclined && (
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="text-xs text-[var(--color-text-muted)] hover:underline"
                    >
                      Declined
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
