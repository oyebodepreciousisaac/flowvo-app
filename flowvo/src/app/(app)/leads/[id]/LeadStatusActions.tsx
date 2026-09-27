"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface LeadStatusActionsProps {
  leadId: string;
  currentStatus: string;
}

export function LeadStatusActions({ leadId, currentStatus }: LeadStatusActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    if (newStatus === currentStatus) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-[var(--color-text-secondary)] font-medium">Update status:</span>
      {currentStatus !== "CONTACTED" && currentStatus !== "WON" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("CONTACTED")}
          className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)] transition-colors disabled:opacity-50"
        >
          Mark as Contacted
        </button>
      )}
      {currentStatus !== "LOST" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("LOST")}
          className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[#ffebeb] text-[var(--color-error)] transition-colors disabled:opacity-50"
        >
          Mark as Lost
        </button>
      )}
      {currentStatus !== "NEW" && (
        <button
          type="button"
          disabled={loading}
          onClick={() => updateStatus("NEW")}
          className="px-2.5 py-1 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] transition-colors disabled:opacity-50"
        >
          Reset to New
        </button>
      )}
    </div>
  );
}
