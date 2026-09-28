"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LiveContext } from "./LiveContext";
import { subscribeToLiveEvents } from "@/lib/live-channel";
import { Zap, X } from "lucide-react";

interface LiveSyncProviderProps {
  children: React.ReactNode;
  pollIntervalMs?: number;
}

export function LiveSyncProvider({
  children,
  pollIntervalMs = 3500,
}: LiveSyncProviderProps) {
  const router = useRouter();
  const [isLive, setIsLive] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const lastFingerprintRef = useRef<string | null>(null);
  const isPollingRef = useRef(false);
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showNotification = useCallback((message: string) => {
    setNotification(message);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    dismissTimerRef.current = setTimeout(() => {
      setNotification(null);
    }, 4500);
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
  }, []);

  const performSync = useCallback(
    async (reason?: string) => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      setIsSyncing(true);

      try {
        const res = await fetch("/api/live/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setLastSyncTime(new Date());
          setIsLive(true);

          if (data.fingerprint) {
            if (
              lastFingerprintRef.current !== null &&
              lastFingerprintRef.current !== data.fingerprint
            ) {
              // Server state changed!
              router.refresh();

              // Formulate a friendly notification
              if (reason) {
                showNotification(reason);
              } else if (data.latestActivity?.eventType) {
                const eventType = data.latestActivity.eventType;
                if (eventType === "lead.created") {
                  showNotification("⚡ New customer enquiry received!");
                } else if (eventType === "quote.accepted") {
                  showNotification("⚡ Quote accepted! Job created.");
                } else if (eventType === "invoice.paid") {
                  showNotification("⚡ Payment recorded for invoice.");
                } else if (eventType === "invoice.overdue") {
                  showNotification("⚡ Invoice marked overdue.");
                } else if (eventType.startsWith("quote.")) {
                  showNotification("⚡ Quote updated live.");
                } else {
                  showNotification("⚡ Real-time updates applied.");
                }
              } else {
                showNotification("⚡ Live update applied.");
              }
            }
            lastFingerprintRef.current = data.fingerprint;
          }
        }
      } catch (err) {
        console.warn("Live status poll failed:", err);
      } finally {
        setIsSyncing(false);
        isPollingRef.current = false;
      }
    },
    [router, showNotification]
  );

  const triggerManualSync = useCallback(async () => {
    await performSync("⚡ Manual sync completed.");
    router.refresh();
  }, [performSync, router]);

  // 1. Cross-tab instant communication via BroadcastChannel
  useEffect(() => {
    const unsubscribe = subscribeToLiveEvents((event) => {
      if (event.type === "LEAD_CREATED") {
        performSync("⚡ New enquiry received from customer!");
        router.refresh();
      } else if (event.type === "QUOTE_ACCEPTED") {
        performSync("⚡ Customer accepted quote!");
        router.refresh();
      } else if (event.type === "QUOTE_DECLINED") {
        performSync("⚡ Customer declined quote.");
        router.refresh();
      } else {
        performSync("⚡ Live update received.");
        router.refresh();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [performSync, router]);

  // 2. Background polling and focus/visibility listeners
  useEffect(() => {
    // Initial fetch on mount via async task
    const initialTimer = setTimeout(() => {
      performSync();
    }, 100);

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && !document.hidden) {
        performSync();
      }
    }, pollIntervalMs);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        performSync();
      }
    };

    const handleFocus = () => {
      performSync();
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleFocus);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleFocus);
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, [performSync, pollIntervalMs]);

  return (
    <LiveContext.Provider
      value={{
        isLive,
        isSyncing,
        lastSyncTime,
        triggerManualSync,
        notification,
        clearNotification,
      }}
    >
      {children}

      {/* Floating Live Notification Toast */}
      {notification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-16 md:bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-[var(--color-text)] text-white rounded-xl shadow-lg border border-[var(--color-primary)] transition-all animate-bounce-short"
        >
          <div className="w-6 h-6 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white shrink-0">
            <Zap className="w-3.5 h-3.5 fill-current" />
          </div>
          <span className="text-sm font-medium pr-1">{notification}</span>
          <button
            onClick={clearNotification}
            className="p-1 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </LiveContext.Provider>
  );
}
