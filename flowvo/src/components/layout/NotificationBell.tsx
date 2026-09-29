"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCircle2, UserPlus, FileText, Receipt, Briefcase, Clock, X } from "lucide-react";

interface ActivityItem {
  id: string;
  eventType: string;
  entityType: string;
  entityId: string;
  leadId?: string | null;
  quoteId?: string | null;
  jobId?: string | null;
  invoiceId?: string | null;
  detail?: string | null;
  occurredAt: string;
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchActivities() {
      try {
        const res = await fetch("/api/live/status", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.recentActivities) {
            setActivities(data.recentActivities);

            // Compute unread based on newLeads or recent items within 24h
            const count = (data.counts?.newLeads || 0) + (data.counts?.unpaidInvoices > 0 ? 1 : 0);
            setUnreadCount(count);
            if (count > 0) {
              setHasNewAlert(true);
            }
          }
        }
      } catch {
        // Silently continue if polling is unavailable
      }
    }

    fetchActivities();
    const interval = setInterval(fetchActivities, 12000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  function getTargetUrl(act: ActivityItem): string {
    if (act.invoiceId) return `/invoices/${act.invoiceId}`;
    if (act.quoteId) return `/quotes/${act.quoteId}`;
    if (act.jobId) return `/jobs/${act.jobId}`;
    if (act.leadId) return `/leads/${act.leadId}`;
    return "/dashboard";
  }

  function getIcon(eventType: string) {
    if (eventType.includes("paid")) {
      return <Receipt className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (eventType.includes("accepted")) {
      return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
    }
    if (eventType.includes("lead")) {
      return <UserPlus className="w-3.5 h-3.5 text-blue-600" />;
    }
    if (eventType.includes("quote")) {
      return <FileText className="w-3.5 h-3.5 text-purple-600" />;
    }
    return <Briefcase className="w-3.5 h-3.5 text-[var(--color-primary)]" />;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setHasNewAlert(false);
        }}
        className="relative p-2 rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-muted)]/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text)]">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {unreadCount} active
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--color-border)]">
            {activities.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--color-text-muted)]">
                No recent notifications.
              </div>
            ) : (
              activities.map((act) => {
                const targetUrl = getTargetUrl(act);
                const timeAgo = formatTimeAgo(new Date(act.occurredAt));

                return (
                  <Link
                    key={act.id}
                    href={targetUrl}
                    onClick={() => setOpen(false)}
                    className="block p-3.5 hover:bg-[var(--color-surface-muted)] transition-colors group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-1.5 rounded-lg bg-[var(--color-surface-muted)] group-hover:bg-[var(--color-surface)] border border-[var(--color-border)] flex-shrink-0 mt-0.5">
                        {getIcon(act.eventType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--color-text)] font-medium leading-snug line-clamp-2">
                          {act.detail || act.eventType}
                        </p>
                        <span className="text-[10px] text-[var(--color-text-muted)] mt-1 flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          <span>{timeAgo}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="p-2.5 bg-[var(--color-surface-muted)]/30 border-t border-[var(--color-border)] text-center">
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="text-[11px] font-medium text-[var(--color-primary)] hover:underline"
            >
              View Activity Timeline
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
