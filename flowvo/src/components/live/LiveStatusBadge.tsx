"use client";

import React, { useState, useEffect } from "react";
import { useLiveSync } from "./LiveContext";
import { RefreshCw } from "lucide-react";

export function LiveStatusBadge({ className = "" }: { className?: string }) {
  const { isLive, isSyncing, lastSyncTime, triggerManualSync } = useLiveSync();
  const [timeAgoStr, setTimeAgoStr] = useState<string>("just now");

  useEffect(() => {
    function updateAgo() {
      if (!lastSyncTime) {
        setTimeAgoStr("connecting...");
        return;
      }
      const seconds = Math.floor((Date.now() - lastSyncTime.getTime()) / 1000);
      if (seconds < 5) {
        setTimeAgoStr("just now");
      } else if (seconds < 60) {
        setTimeAgoStr(`${seconds}s ago`);
      } else {
        const mins = Math.floor(seconds / 60);
        setTimeAgoStr(`${mins}m ago`);
      }
    }

    updateAgo();
    const interval = setInterval(updateAgo, 5000);
    return () => clearInterval(interval);
  }, [lastSyncTime]);

  return (
    <div
      className={`inline-flex items-center gap-1.5 sm:gap-2 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-xs text-[var(--color-text-secondary)] shadow-2xs select-none shrink-0 ${className}`}
      title="Live real-time sync active — changes from customers or background crons update automatically"
    >
      <div className="flex items-center gap-1.5">
        <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
          {isLive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          )}
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 ${
              isLive ? "bg-emerald-500" : "bg-amber-500"
            }`}
          />
        </span>
        <span className="font-semibold text-[10px] sm:text-[11px] tracking-wide text-[var(--color-text)]">
          Live
        </span>
      </div>

      <span className="hidden sm:inline text-[var(--color-border-strong)]">|</span>

      <span className="hidden sm:inline text-[11px] text-[var(--color-text-muted)]">
        {isSyncing ? "Syncing..." : timeAgoStr}
      </span>

      <button
        type="button"
        onClick={() => triggerManualSync()}
        disabled={isSyncing}
        className="p-0.5 rounded-full hover:bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
        title="Force refresh now"
        aria-label="Force refresh now"
      >
        <RefreshCw
          className={`w-3 h-3 ${isSyncing ? "animate-spin text-[var(--color-primary)]" : ""}`}
        />
      </button>
    </div>
  );
}
