import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatPence } from "@/lib/invoice";
import { LineItem } from "@/lib/email-templates/quote-email";
import { JobScheduleEditor } from "./JobScheduleEditor";
import { ArrowLeft, Clock, CheckCircle2, XCircle, Phone, Mail, FileText } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const session = await getCurrentSession();
  if (!session) return { title: "Job Details — Flowvo" };

  const job = await prisma.job.findFirst({
    where: { id, businessId: session.user.businessId },
    select: { customerName: true },
  });

  return {
    title: job ? `Job: ${job.customerName} — Flowvo` : "Job Details — Flowvo",
  };
}

export default async function JobDetailPage({ params }: PageProps) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  const job = await prisma.job.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
    include: {
      invoices: true,
      activityLogs: {
        orderBy: { occurredAt: "desc" },
      },
    },
  });

  if (!job) {
    notFound();
  }

  let lineItems: LineItem[] = [];
  try {
    lineItems = job.lineItems ? JSON.parse(job.lineItems) : [];
  } catch {
    lineItems = [];
  }

  const amountFormatted = formatPence(job.amount);

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div>
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Jobs</span>
        </Link>
      </div>

      {/* Main Header Card */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
                {job.customerName}
              </h1>
              <StatusChip status={job.status} />
            </div>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {job.description}
            </p>
          </div>

          <div className="text-right">
            <span className="block text-xs uppercase font-semibold text-[var(--color-text-muted)]">
              Job Value
            </span>
            <span className="font-mono text-2xl font-bold text-[var(--color-primary)]">
              {amountFormatted}
            </span>
          </div>
        </div>

        {/* Schedule & Completion Actions */}
        <JobScheduleEditor
          jobId={job.id}
          customerName={job.customerName}
          initialScheduledDate={job.scheduledDate?.toISOString() ?? null}
          initialStatus={job.status}
          amountFormatted={amountFormatted}
          invoiceId={job.invoices[0]?.id}
        />
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Line Items & Customer Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer details card */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)] space-y-3">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)]">
              Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="block text-[var(--color-text-muted)] mb-0.5">Name</span>
                <span className="font-semibold text-sm text-[var(--color-text)] block">
                  {job.customerName}
                </span>
              </div>
              <div>
                <span className="block text-[var(--color-text-muted)] mb-0.5">Phone</span>
                <a
                  href={`tel:${job.customerPhone}`}
                  className="inline-flex items-center gap-1 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span>{job.customerPhone}</span>
                </a>
              </div>
              <div>
                <span className="block text-[var(--color-text-muted)] mb-0.5">Email</span>
                <a
                  href={`mailto:${job.customerEmail}`}
                  className="inline-flex items-center gap-1 font-medium text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate max-w-full"
                >
                  <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                  <span className="truncate">{job.customerEmail}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Line items table card */}
          {lineItems.length > 0 && (
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
              <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4">
                Work Scope & Line Items
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                      <th className="py-2.5 pr-2 font-semibold">Description</th>
                      <th className="py-2.5 px-2 font-semibold text-center w-16">Qty</th>
                      <th className="py-2.5 px-2 font-semibold text-right w-24">Rate</th>
                      <th className="py-2.5 pl-2 font-semibold text-right w-24">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {lineItems.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td className="py-3 pr-2 font-medium text-[var(--color-text)]">{item.description}</td>
                        <td className="py-3 px-2 text-center text-[var(--color-text-secondary)]">{item.quantity}</td>
                        <td className="py-3 px-2 text-right font-mono text-[var(--color-text-secondary)]">{formatPence(item.unitPricePence)}</td>
                        <td className="py-3 pl-2 text-right font-mono font-semibold text-[var(--color-text)]">{formatPence(item.lineTotalPence)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-[var(--color-border-strong)]">
                      <td colSpan={3} className="pt-4 text-right font-bold text-sm text-[var(--color-text)]">Total:</td>
                      <td className="pt-4 text-right font-mono font-bold text-base text-[var(--color-primary)]">{amountFormatted}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Activity Timeline */}
        <div className="space-y-6">
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider mb-4 flex items-center justify-between">
              <span>Activity Timeline</span>
              <Clock className="w-4 h-4 text-[var(--color-text-muted)]" />
            </h2>

            {job.activityLogs.length === 0 ? (
              <p className="text-xs text-[var(--color-text-muted)]">No activity recorded yet.</p>
            ) : (
              <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
                {job.activityLogs.map((log) => {
                  const isSuccess = log.status === "SUCCESS";
                  let eventLabel = log.eventType;
                  let description = log.detail;

                  if (log.eventType === "job.created") {
                    eventLabel = "Job created";
                  } else if (log.eventType === "job.status_complete") {
                    eventLabel = "Job completed";
                  } else if (log.eventType === "job.rescheduled") {
                    eventLabel = "Job scheduled / updated";
                  } else if (log.eventType === "invoice.drafted") {
                    eventLabel = "Invoice auto-drafted";
                  }

                  return (
                    <div key={log.id} className="relative group">
                      <span
                        className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-[var(--color-surface)] ${
                          isSuccess
                            ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                            : "border-[var(--color-error)] text-[var(--color-error)]"
                        }`}
                      >
                        {isSuccess ? (
                          <CheckCircle2 className="w-3 h-3 fill-current" />
                        ) : (
                          <XCircle className="w-3 h-3 fill-current" />
                        )}
                      </span>

                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[var(--color-text)]">
                            {eventLabel}
                          </p>
                          <span className="text-[10px] text-[var(--color-text-muted)]">
                            {new Date(log.occurredAt).toLocaleTimeString("en-GB", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {description && (
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            {description}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-[var(--color-text-muted)]">
                          {new Date(log.occurredAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
