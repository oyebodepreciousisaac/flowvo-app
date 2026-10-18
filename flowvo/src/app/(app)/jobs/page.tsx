import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatAmount } from "@/lib/currency";
import { JobCardAction } from "./JobCardAction";
import { Briefcase, Calendar, Phone, Mail, ArrowRight } from "lucide-react";

export const metadata: Metadata = { title: "Jobs — Settlevo" };

export default async function JobsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const jobs = await prisma.job.findMany({
    where: { businessId: session.user.businessId },
    include: {
      invoices: true,
    },
    orderBy: [
      { scheduledDate: "asc" },
      { createdAt: "desc" },
    ],
    take: 50,
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Jobs</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {jobs.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Active jobs from accepted quotes. Schedule dates and mark complete from your phone or desktop.
          </p>
        </div>
      </div>

      {/* Main Content: Empty State or Jobs List */}
      {jobs.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-xl mx-auto my-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No active jobs</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
            When a quote is accepted by a customer, a job appears here automatically ready to be scheduled and carried out.
          </p>
          <Link
            href="/quotes"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-md)] text-sm font-semibold transition-colors shadow-sm"
          >
            <span>View quotes</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => {
            const isComplete = job.status === "COMPLETE";
            const formattedAmount = formatAmount(job.amount, job.currency || "NGN");

            return (
              <div
                key={job.id}
                className={`flex flex-col justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5 transition-shadow hover:shadow-md ${
                  isComplete ? "border-[var(--color-border)] opacity-90" : "border-[var(--color-border)]"
                }`}
              >
                <div>
                  {/* Top row: Status chip & Scheduled Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusChip status={job.status} />
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      {job.scheduledDate
                        ? new Date(job.scheduledDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Unscheduled"}
                    </span>
                  </div>

                  {/* Customer Name & Link */}
                  <Link href={`/jobs/${job.id}`} className="group block">
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {job.customerName}
                    </h3>
                  </Link>

                  {/* Service Description */}
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {job.description}
                  </p>

                  {/* Amount */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">Job Amount:</span>
                    <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                      {formattedAmount}
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2 text-[11px] sm:text-xs text-[var(--color-text-secondary)] flex-wrap">
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span>{job.customerPhone}</span>
                    </a>
                    <a
                      href={`mailto:${job.customerEmail}`}
                      className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors truncate max-w-[150px] xs:max-w-[200px]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate">{job.customerEmail}</span>
                    </a>
                  </div>
                </div>

                {/* Primary Action Button Per Status per DESIGN.md */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View details
                  </Link>

                  <JobCardAction
                    jobId={job.id}
                    customerName={job.customerName}
                    amountFormatted={formattedAmount}
                    status={job.status}
                    invoiceId={job.invoices[0]?.id}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
