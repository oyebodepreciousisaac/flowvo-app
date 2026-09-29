"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { Printer, ArrowLeft } from "lucide-react";

interface PrintControlsProps {
  invoiceId: string;
  invoiceNumber: string;
}

export function PrintControls({ invoiceId, invoiceNumber }: PrintControlsProps) {
  useEffect(() => {
    // If opened with ?autoPrint=1 or ?print=true, auto-open print dialog
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autoPrint") === "1" || params.get("print") === "true") {
        setTimeout(() => window.print(), 350);
      }
    }
  }, []);

  return (
    <div className="no-print bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-30 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={`/invoices/${invoiceId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Invoice</span>
          </Link>
          <span className="text-xs text-[var(--color-text-muted)]">|</span>
          <span className="text-xs font-medium text-[var(--color-text)]">
            Print Preview · {invoiceNumber}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline text-[11px] text-[var(--color-text-muted)]">
            Select &quot;Save as PDF&quot; in destination to save
          </span>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-xs font-semibold rounded-[var(--radius-md)] shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}
