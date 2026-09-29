import React from "react";

// ─── Status type union ───────────────────────────────────────────────────────
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

// ─── 6-tier colour system ─────────────────────────────────────────────────────
//
//  BLUE   — NEW, SCHEDULED       → informational, not yet started
//  AMBER  — CONTACTED, IN_PROGRESS, ACTION_NEEDED  → in-motion, needs action
//  VIOLET — QUOTED, SENT         → advanced stage, awaiting response/payment
//  GREEN  — WON, COMPLETE, PAID  → positive outcome / done
//  GREY   — DRAFT                → unpublished / not sent yet
//  RED    — LOST, DECLINED, OVERDUE → negative / danger terminal state
//
//  Research sources: HubSpot, Pipedrive, Salesforce, ServiceTitan, Jobber,
//  Tradify, Commusoft  (see docs/14-IMPROVEMENT-BACKLOG.md — Slice B)
// ─────────────────────────────────────────────────────────────────────────────

type ColourTier = "blue" | "amber" | "violet" | "green" | "grey" | "red";

const STATUS_TO_TIER: Record<string, ColourTier> = {
  // Blue — informational / not yet started
  NEW: "blue",
  SCHEDULED: "blue",

  // Amber — in-motion / pending action
  CONTACTED: "amber",
  IN_PROGRESS: "amber",
  ACTION_NEEDED: "amber",

  // Violet — quote or invoice sent, awaiting customer decision or payment
  QUOTED: "violet",
  SENT: "violet",

  // Green — positive outcome
  WON: "green",
  COMPLETE: "green",
  PAID: "green",

  // Grey — unpublished draft
  DRAFT: "grey",

  // Red — negative / danger / overdue
  LOST: "red",
  DECLINED: "red",
  OVERDUE: "red",
};

const TIER_STYLES: Record<ColourTier, { bg: string; text: string }> = {
  blue: {
    bg: "bg-[var(--color-status-blue)]",
    text: "text-[var(--color-status-blue-text)]",
  },
  amber: {
    bg: "bg-[var(--color-status-amber)]",
    text: "text-[var(--color-status-amber-text)]",
  },
  violet: {
    bg: "bg-[var(--color-status-violet)]",
    text: "text-[var(--color-status-violet-text)]",
  },
  green: {
    bg: "bg-[var(--color-status-green)]",
    text: "text-[var(--color-status-green-text)]",
  },
  grey: {
    bg: "bg-[var(--color-status-grey)]",
    text: "text-[var(--color-status-grey-text)]",
  },
  red: {
    bg: "bg-[var(--color-status-red)]",
    text: "text-[var(--color-status-red-text)]",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface StatusChipProps {
  status: StatusType | string;
  label?: string;
  className?: string;
}

export function StatusChip({ status, label, className = "" }: StatusChipProps) {
  const norm = status.toUpperCase().replace(/\s+/g, "_");
  const displayLabel = label ?? norm.replace(/_/g, " ");

  // Look up the tier; fall back to grey for any unrecognised status value
  const tier: ColourTier = STATUS_TO_TIER[norm] ?? "grey";
  const { bg, text } = TIER_STYLES[tier];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase ${bg} ${text} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {displayLabel}
    </span>
  );
}
