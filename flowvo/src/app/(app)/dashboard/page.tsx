import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/currency";
import {
  AlertTriangle,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
  Users,
  Briefcase,
  ArrowRight,
  Plus,
} from "lucide-react";
import { LiveStatusBadge } from "@/components/live/LiveStatusBadge";

export const metadata: Metadata = {
  title: "Dashboard — Flowvo",
};

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const businessId = session.user.businessId;
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // 1. Fetch action items in severity order
  // Severity 1: Overdue invoices (red)
  const overdueInvoices = await prisma.invoice.findMany({
    where: { businessId, status: "OVERDUE" },
    orderBy: { dueDate: "asc" },
  });

  // Severity 2: Email delivery failures / bounces (red)
  const deliveryFailures = await prisma.invoice.findMany({
    where: {
      businessId,
      emailDeliveryStatus: "BOUNCED",
    },
    orderBy: { updatedAt: "desc" },
  });

  // Severity 3: Draft invoices awaiting send (amber)
  const draftInvoices = await prisma.invoice.findMany({
    where: { businessId, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
  });

  // Severity 4: Quotes with no response for >7 days (amber)
  const stalledQuotes = await prisma.quote.findMany({
    where: {
      businessId,
      status: "SENT",
      sentAt: { lt: sevenDaysAgo },
    },
    include: { lead: true },
    orderBy: { sentAt: "asc" },
  });

  // Severity 5: New leads awaiting first contact (teal)
  const newLeads = await prisma.lead.findMany({
    where: { businessId, status: "NEW" },
    orderBy: { createdAt: "desc" },
  });

  // 2. Fetch summary counts (clickable to filtered views)
  const [activeLeadsCount, openQuotesCount, jobsInProgressCount, unpaidInvoicesCount] =
    await Promise.all([
      prisma.lead.count({
        where: { businessId, status: { in: ["NEW", "CONTACTED", "QUOTED"] } },
      }),
      prisma.quote.count({
        where: { businessId, status: { in: ["DRAFT", "SENT"] } },
      }),
      prisma.job.count({
        where: { businessId, status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      }),
      prisma.invoice.count({
        where: { businessId, status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
      }),
    ]);

  // Build unified action item list ordered strictly by severity
  interface ActionItem {
    id: string;
    severity: "danger" | "warning" | "info";
    category: string;
    title: string;
    description: string;
    actionLabel: string;
    actionHref: string;
  }

  const actionItems: ActionItem[] = [];

  // Severity 1: Overdue Invoices (danger)
  for (const inv of overdueInvoices) {
    const daysOverdue = Math.max(
      1,
      Math.floor((now.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    );
    actionItems.push({
      id: `overdue-${inv.id}`,
      severity: "danger",
      category: "Overdue Invoice",
      title: `Invoice ${inv.invoiceNumber} for ${inv.customerName} is ${daysOverdue} ${daysOverdue === 1 ? "day" : "days"} overdue`,
      description: `Payment of ${formatAmount(inv.total, inv.currency || "NGN")} was due on ${new Date(inv.dueDate).toLocaleDateString("en-GB")}.`,
      actionLabel: "View invoice",
      actionHref: `/invoices/${inv.id}`,
    });
  }

  // Severity 2: Delivery failures (danger)
  for (const failure of deliveryFailures) {
    // Avoid duplicate if already reported in overdue
    if (!actionItems.some((item) => item.actionHref === `/invoices/${failure.id}`)) {
      actionItems.push({
        id: `bounce-${failure.id}`,
        severity: "danger",
        category: "Email Delivery Failure",
        title: `Email delivery bounced for ${failure.customerName}`,
        description: `Customer email ${failure.customerEmail} rejected the invoice transmission. Verify the address.`,
        actionLabel: "Review invoice",
        actionHref: `/invoices/${failure.id}`,
      });
    }
  }

  // Severity 3: Draft invoices awaiting send (warning)
  for (const draft of draftInvoices) {
    actionItems.push({
      id: `draft-${draft.id}`,
      severity: "warning",
      category: "Invoice Ready",
      title: `Invoice draft ready for ${draft.customerName}`,
      description: `Draft for ${formatAmount(draft.total, draft.currency || "NGN")} auto-generated from completed work awaiting your approval.`,
      actionLabel: "Review & send",
      actionHref: `/invoices/${draft.id}`,
    });
  }

  // Severity 4: Stalled quotes (warning)
  for (const quote of stalledQuotes) {
    const daysSince = Math.floor(
      (now.getTime() - (quote.sentAt ? new Date(quote.sentAt).getTime() : now.getTime())) /
        (1000 * 60 * 60 * 24)
    );
    actionItems.push({
      id: `stalled-quote-${quote.id}`,
      severity: "warning",
      category: "Quote Follow-up",
      title: `Quote for ${quote.lead.customerName} sent ${daysSince} days ago with no response`,
      description: `Total quote value: ${formatAmount(quote.total, quote.currency || "NGN")}. Consider calling the customer directly.`,
      actionLabel: "View quote",
      actionHref: `/quotes/${quote.id}`,
    });
  }

  // Severity 5: New leads (info/teal)
  for (const lead of newLeads) {
    actionItems.push({
      id: `lead-${lead.id}`,
      severity: "info",
      category: "New Lead",
      title: `New enquiry received from ${lead.customerName}`,
      description: `${lead.serviceType} — received ${new Date(lead.createdAt).toLocaleDateString("en-GB")}.`,
      actionLabel: "Contact lead",
      actionHref: `/leads/${lead.id}`,
    });
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Real-time lead-to-cash workflow status and required actions.
          </p>
        </div>
        <div className="self-start sm:self-auto">
          <LiveStatusBadge />
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/leads"
          className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--color-border-focus)] transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            <span>Active Leads</span>
            <Users className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text)]">
            {activeLeadsCount}
          </div>
          <span className="text-[11px] text-[var(--color-primary)] font-medium group-hover:underline inline-flex items-center gap-1 mt-1">
            <span>View leads</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          href="/quotes"
          className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--color-border-focus)] transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            <span>Open Quotes</span>
            <FileText className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text)]">
            {openQuotesCount}
          </div>
          <span className="text-[11px] text-[var(--color-primary)] font-medium group-hover:underline inline-flex items-center gap-1 mt-1">
            <span>View quotes</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          href="/jobs"
          className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--color-border-focus)] transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            <span>Jobs in Progress</span>
            <Briefcase className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text)]">
            {jobsInProgressCount}
          </div>
          <span className="text-[11px] text-[var(--color-primary)] font-medium group-hover:underline inline-flex items-center gap-1 mt-1">
            <span>View jobs</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>

        <Link
          href="/invoices"
          className="group block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4 shadow-[var(--shadow-card)] hover:border-[var(--color-border-focus)] transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
            <span>Unpaid Invoices</span>
            <Clock className="w-4 h-4 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors" />
          </div>
          <div className="font-mono text-2xl font-bold text-[var(--color-text)]">
            {unpaidInvoicesCount}
          </div>
          <span className="text-[11px] text-[var(--color-primary)] font-medium group-hover:underline inline-flex items-center gap-1 mt-1">
            <span>View invoices</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        </Link>
      </div>

      {/* Action Strip: Urgent Items Ordered by Severity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text)]">
            Action items requiring attention
          </h2>
          {actionItems.length > 0 && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {actionItems.length} {actionItems.length === 1 ? "item" : "items"}
            </span>
          )}
        </div>

        {actionItems.length === 0 ? (
          /* Empty State per DESIGN.md section 7.9 */
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-lg mx-auto">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mb-4">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
              All caught up.
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
              There are no pending actions or overdue items requiring your attention right now.
            </p>
            <Link
              href="/leads"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-text)] rounded-[var(--radius-md)] text-xs font-semibold transition-colors border border-[var(--color-border)]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add a lead manually</span>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {actionItems.map((item) => {
              const isDanger = item.severity === "danger";
              const isWarning = item.severity === "warning";

              const borderClass = isDanger
                ? "border-l-4 border-l-[var(--color-error)] bg-[var(--color-surface)]"
                : isWarning
                ? "border-l-4 border-l-[var(--color-warning)] bg-[var(--color-surface)]"
                : "border-l-4 border-l-[var(--color-primary)] bg-[var(--color-surface)]";

              const icon = isDanger ? (
                <AlertCircle className="w-4 h-4 text-[var(--color-error)] flex-shrink-0 mt-0.5" />
              ) : isWarning ? (
                <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] flex-shrink-0 mt-0.5" />
              ) : (
                <Sparkles className="w-4 h-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
              );

              return (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-[var(--radius-md)] border border-[var(--color-border)] ${borderClass} shadow-[var(--shadow-card)] transition-shadow hover:shadow-md`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {icon}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                          {item.category}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-[var(--color-text)] truncate">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] flex-shrink-0">
                    <Link
                      href={item.actionHref}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors border border-[var(--color-border)]"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
