import React from "react";
import { XCircle, Zap, Edit3 } from "lucide-react";

export interface ActivityLogItem {
  id: string;
  eventType: string;
  status: string;
  detail: string | null;
  occurredAt: Date | string;
}

interface ActivityTimelineProps {
  logs: ActivityLogItem[];
  emptyMessage?: string;
}

const AUTOMATED_EVENT_PREFIXES = [
  "ack.",
  "quote.followup",
  "invoice.drafted",
  "invoice.overdue",
  "invoice.email_bounced",
  "review.sent",
  "review.reminder",
  "review.blocked",
];

function isAutomatedEvent(eventType: string): boolean {
  if (AUTOMATED_EVENT_PREFIXES.some((prefix) => eventType.startsWith(prefix))) {
    return true;
  }
  if (eventType === "lead.created") {
    return true; // Received via web enquiry
  }
  return false;
}

function formatTimelineDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday) {
    return `Today ${timeStr}`;
  }
  if (isYesterday) {
    return `Yesterday ${timeStr}`;
  }

  const dateStr = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${dateStr} ${timeStr}`;
}

function getEventDisplay(eventType: string, detail: string | null) {
  let label = eventType;
  let defaultDetail = detail;

  switch (eventType) {
    case "lead.created":
      label = "Enquiry received";
      defaultDetail = defaultDetail || "Submitted via customer enquiry form";
      break;
    case "ack.sent":
      label = "Acknowledgement email sent";
      defaultDetail = defaultDetail || "Confirmation delivered to customer";
      break;
    case "ack.failed":
      label = "Acknowledgement delivery failed";
      break;
    case "lead.status_contacted":
      label = "Lead contacted";
      break;
    case "lead.status_quoted":
      label = "Quote drafted for lead";
      break;
    case "lead.status_won":
      label = "Lead converted / won";
      break;
    case "lead.status_lost":
      label = "Lead marked as lost";
      break;
    case "quote.created":
      label = "Quote created";
      defaultDetail = defaultDetail || "Quote drafted";
      break;
    case "quote.sent":
      label = "Quote sent to customer";
      defaultDetail = defaultDetail || "Sent via email";
      break;
    case "quote.send_failed":
      label = "Quote send failed";
      break;
    case "quote.followup_sent":
      label = "Automated follow-up sent";
      defaultDetail = defaultDetail || "Gentle reminder sent via email";
      break;
    case "quote.followup_failed":
      label = "Quote follow-up failed";
      break;
    case "quote.accepted":
      label = "Quote accepted";
      defaultDetail = defaultDetail || "Accepted by customer";
      break;
    case "quote.declined":
      label = "Quote declined";
      break;
    case "job.created":
      label = "Job created";
      defaultDetail = defaultDetail || "Created from accepted quote";
      break;
    case "job.scheduled":
    case "job.rescheduled":
      label = "Job scheduled";
      break;
    case "job.status_in_progress":
      label = "Job started";
      break;
    case "job.status_complete":
      label = "Job completed";
      break;
    case "invoice.drafted":
      label = "Invoice drafted";
      defaultDetail = defaultDetail || "Auto-drafted upon job completion";
      break;
    case "invoice.sent":
      label = "Invoice sent";
      defaultDetail = defaultDetail || "Invoice sent to customer";
      break;
    case "invoice.send_failed":
      label = "Invoice send failed";
      break;
    case "invoice.overdue":
      label = "Invoice overdue";
      defaultDetail = defaultDetail || "Payment past due date";
      break;
    case "invoice.email_bounced":
      label = "Invoice email bounced";
      defaultDetail = defaultDetail || "Delivery failed permanently";
      break;
    case "invoice.paid":
      label = "Payment recorded";
      defaultDetail = defaultDetail || "Invoice marked as paid";
      break;
    case "review.sent":
      label = "Review request sent";
      defaultDetail = defaultDetail || "Review link sent to customer";
      break;
    case "review.send_failed":
      label = "Review request send failed";
      break;
    case "review.reminder_sent":
      label = "Review reminder sent";
      defaultDetail = defaultDetail || "Review reminder sent to customer";
      break;
    case "review.reminder_failed":
      label = "Review reminder send failed";
      break;
    case "review.blocked_unsubscribed":
      label = "Review blocked (unsubscribed)";
      defaultDetail = defaultDetail || "Customer previously opted out";
      break;
    case "review.blocked_missing_url":
      label = "Review skipped (no URL)";
      defaultDetail = defaultDetail || "No Google Review link configured";
      break;
    case "review.unsubscribed":
      label = "Customer unsubscribed";
      defaultDetail = defaultDetail || "Customer opted out of review reminders";
      break;
    default:
      label = eventType.replace(".", " - ").replace("_", " ");
  }

  return { label, detail: defaultDetail };
}

export function ActivityTimeline({
  logs,
  emptyMessage = "No activity recorded yet.",
}: ActivityTimelineProps) {
  if (!logs || logs.length === 0) {
    return <p className="text-xs text-[var(--color-text-muted)]">{emptyMessage}</p>;
  }

  // Sort reverse chronological: newest first
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[var(--color-border)]">
      {sortedLogs.map((log) => {
        const isSuccess = log.status !== "FAILURE";
        const automated = isAutomatedEvent(log.eventType);
        const { label, detail } = getEventDisplay(log.eventType, log.detail);
        const timestamp = formatTimelineDate(log.occurredAt);
        const actor = automated ? "Settlevo automation" : "Owner action";

        return (
          <div key={log.id} className="relative group">
            {/* Timeline icon node */}
            <span
              className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full flex items-center justify-center border-2 bg-[var(--color-surface)] ${
                !isSuccess
                  ? "border-[var(--color-error)] text-[var(--color-error)]"
                  : automated
                  ? "border-[var(--color-primary)] text-[var(--color-primary)]"
                  : "border-[var(--color-border-strong)] text-[var(--color-text-secondary)]"
              }`}
              title={automated ? "⚡ Automated event" : "✎ Manual owner event"}
            >
              {!isSuccess ? (
                <XCircle className="w-3 h-3 fill-current" />
              ) : automated ? (
                <span className="text-[10px] font-bold leading-none select-none">⚡</span>
              ) : (
                <span className="text-[10px] font-bold leading-none select-none">✎</span>
              )}
            </span>

            {/* Content block */}
            <div className="text-xs">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-[var(--color-text)]">{label}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      automated
                        ? "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]"
                        : "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {automated ? (
                      <>
                        <Zap className="w-2.5 h-2.5 inline" />
                        <span>{actor}</span>
                      </>
                    ) : (
                      <>
                        <Edit3 className="w-2.5 h-2.5 inline" />
                        <span>{actor}</span>
                      </>
                    )}
                  </span>
                </div>
                <span className="text-[11px] text-[var(--color-text-muted)] whitespace-nowrap">
                  {timestamp}
                </span>
              </div>

              {detail && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{detail}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
