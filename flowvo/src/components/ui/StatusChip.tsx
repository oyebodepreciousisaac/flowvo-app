import React from "react";

export type StatusType =
  | "NEW"
  | "SCHEDULED"
  | "CONTACTED"
  | "IN_PROGRESS"
  | "QUOTED"
  | "SENT"
  | "DRAFT"
  | "ACTION_NEEDED"
  | "WON"
  | "COMPLETE"
  | "PAID"
  | "OVERDUE"
  | "LOST"
  | "DECLINED";

interface StatusChipProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export function StatusChip({ status, label, className = "" }: StatusChipProps) {
  const norm = status.toUpperCase().replace(/\s+/g, "_");
  const displayLabel = label || norm.replace(/_/g, " ");

  let bg = "bg-[var(--color-status-lost)]";
  let text = "text-[var(--color-text-muted)]";

  if (["NEW", "SCHEDULED", "WON", "COMPLETE", "PAID"].includes(norm)) {
    bg = "bg-[var(--color-status-new)]";
    text = "text-[var(--color-primary)]";
  } else if (["QUOTED", "SENT", "DRAFT", "ACTION_NEEDED"].includes(norm)) {
    bg = "bg-[var(--color-status-action)]";
    text = "text-[var(--color-warning)]";
  } else if (["CONTACTED", "IN_PROGRESS"].includes(norm)) {
    bg = "bg-[var(--color-surface-muted)]";
    text = "text-[var(--color-text-secondary)]";
  } else if (["OVERDUE"].includes(norm)) {
    bg = "bg-[var(--color-status-overdue)]";
    text = "text-[var(--color-error)]";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase ${bg} ${text} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {displayLabel}
    </span>
  );
}
