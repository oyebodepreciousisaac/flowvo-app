"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatAmount } from "@/lib/currency";
import {
  Search,
  SlidersHorizontal,
  X,
  FileText,
  Briefcase,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Send,
  FileEdit,
  XCircle,
  FolderOpen,
} from "lucide-react";

export interface QuoteItemData {
  id: string;
  quoteNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  quoteToken: string;
  sentAt: string | null;
  acceptedAt: string | null;
  createdAt: string | Date;
  lead: {
    id: string;
    serviceType: string;
  } | null;
  jobs: { id: string }[];
}

interface QuotesViewProps {
  initialQuotes: QuoteItemData[];
}

const QUOTE_CATEGORIES = [
  { key: "ALL", label: "All Quotes", icon: FileText },
  { key: "ACCEPTED", label: "Accepted", icon: CheckCircle2 },
  { key: "SENT", label: "Sent & Active", icon: Send },
  { key: "DRAFT", label: "Drafts", icon: FileEdit },
  { key: "DECLINED", label: "Declined", icon: XCircle },
] as const;

export function QuotesView({ initialQuotes }: QuotesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Financial sums & counts per status category
  const stats = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {
      ALL: { count: initialQuotes.length, totalAmount: 0 },
    };

    for (const cat of QUOTE_CATEGORIES) {
      if (cat.key !== "ALL") {
        map[cat.key] = { count: 0, totalAmount: 0 };
      }
    }

    for (const q of initialQuotes) {
      map.ALL.totalAmount += q.total;
      if (map[q.status]) {
        map[q.status].count += 1;
        map[q.status].totalAmount += q.total;
      }
    }

    return map;
  }, [initialQuotes]);

  // Filtered quotes list
  const filteredQuotes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialQuotes.filter((quote) => {
      const matchesStatus = selectedStatus === "ALL" || quote.status === selectedStatus;
      if (!matchesStatus) return false;

      if (!query) return true;
      return (
        quote.customerName.toLowerCase().includes(query) ||
        quote.customerEmail.toLowerCase().includes(query) ||
        quote.quoteNumber.toLowerCase().includes(query) ||
        (quote.lead?.serviceType && quote.lead.serviceType.toLowerCase().includes(query))
      );
    });
  }, [initialQuotes, searchQuery, selectedStatus]);

  const activeCategory = QUOTE_CATEGORIES.find((c) => c.key === selectedStatus) || QUOTE_CATEGORIES[0];

  return (
    <div className="space-y-5">
      {/* Search Bar & Category Modal Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search quotes by client, quote #, service..."
            className="w-full pl-9 pr-9 py-2 text-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Categories</span>
            {selectedStatus !== "ALL" && (
              <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
            )}
          </button>
        </div>
      </div>

      {/* Horizontal Status Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium border-b border-[var(--color-border)]">
        {QUOTE_CATEGORIES.map((cat) => {
          const isSelected = selectedStatus === cat.key;
          const stat = stats[cat.key] || { count: 0, totalAmount: 0 };
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedStatus(cat.key)}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? "bg-[var(--color-primary)] text-white font-semibold shadow-2xs"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? "bg-white/20 text-white" : "bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
                }`}
              >
                {stat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Filter Summary Bar */}
      {(selectedStatus !== "ALL" || searchQuery) && (
        <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-[var(--color-surface-muted)] text-xs text-[var(--color-text-secondary)]">
          <div className="flex items-center gap-2">
            <span>
              Showing <strong>{filteredQuotes.length}</strong> {filteredQuotes.length === 1 ? "quote" : "quotes"}
              {selectedStatus !== "ALL" && (
                <span> in <span className="font-semibold text-[var(--color-text)]">{activeCategory.label}</span></span>
              )}
              {searchQuery && (
                <span> matching &quot;{searchQuery}&quot;</span>
              )}
            </span>
          </div>
          <button
            onClick={() => {
              setSelectedStatus("ALL");
              setSearchQuery("");
            }}
            className="text-[var(--color-primary)] hover:underline font-semibold cursor-pointer"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Quotes Grid */}
      {filteredQuotes.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-md mx-auto my-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)] mb-1">
            No quotes found
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {searchQuery
              ? `No quotes match "${searchQuery}" in ${activeCategory.label}.`
              : `There are currently no quotes under ${activeCategory.label}.`}
          </p>
          {(searchQuery || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              View all quotes
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredQuotes.map((quote) => {
            const isDraft = quote.status === "DRAFT";
            const isSent = quote.status === "SENT";
            const isAccepted = quote.status === "ACCEPTED";
            const isDeclined = quote.status === "DECLINED";

            return (
              <div
                key={quote.id}
                className={`flex flex-col justify-between rounded-xl border bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5 transition-shadow hover:shadow-md ${
                  isDeclined ? "border-[var(--color-border)] opacity-75" : "border-[var(--color-border)]"
                }`}
              >
                <div>
                  {/* Top row: Status chip & Quote Reference */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusChip status={quote.status as any} />
                    <span className="font-mono text-xs font-bold text-[var(--color-text-muted)]">
                      {quote.quoteNumber}
                    </span>
                  </div>

                  {/* Customer Name & Link */}
                  <Link href={`/quotes/${quote.id}`} className="group block">
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {quote.customerName}
                    </h3>
                  </Link>

                  {/* Service type from associated lead */}
                  {quote.lead?.serviceType && (
                    <div className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                      {quote.lead.serviceType}
                    </div>
                  )}

                  {/* Total quote amount */}
                  <div className="mt-3 text-lg font-bold font-mono text-[var(--color-text)]">
                    {formatAmount(quote.total, "NGN")}
                  </div>

                  {/* Date details */}
                  <div className="mt-2 text-[11px] text-[var(--color-text-muted)]">
                    {isAccepted && quote.acceptedAt && (
                      <span>Accepted on {new Date(quote.acceptedAt).toLocaleDateString("en-GB")}</span>
                    )}
                    {isSent && quote.sentAt && (
                      <span>Sent on {new Date(quote.sentAt).toLocaleDateString("en-GB")}</span>
                    )}
                    {isDraft && (
                      <span>Created on {new Date(quote.createdAt).toLocaleDateString("en-GB")}</span>
                    )}
                    {isDeclined && (
                      <span className="text-[var(--color-error)]">Declined by client</span>
                    )}
                  </div>
                </div>

                {/* Primary Action Button Per Status */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/quotes/${quote.id}`}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View details
                  </Link>

                  {isDraft && (
                    <Link
                      href={`/quotes/${quote.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors"
                    >
                      <span>Review &amp; send</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {isSent && (
                    <Link
                      href={`/q/${quote.quoteToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors border border-[var(--color-border)]"
                    >
                      <span>Customer view</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {isAccepted && (
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary-subtle)] hover:bg-[#d6ece7] text-[var(--color-primary)] transition-colors"
                    >
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>View job</span>
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Category Breakdown Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col text-[var(--color-text)] animate-in zoom-in-95 duration-150"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="font-bold text-sm">Quote Categories &amp; Financials</h3>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="p-1 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-2.5">
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Isolate specific quote stages or review financial totals per section.
              </p>

              {QUOTE_CATEGORIES.map((cat) => {
                const isSelected = selectedStatus === cat.key;
                const stat = stats[cat.key] || { count: 0, totalAmount: 0 };
                const Icon = cat.icon;

                return (
                  <button
                    key={cat.key}
                    onClick={() => {
                      setSelectedStatus(cat.key);
                      setIsFilterModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[var(--color-primary)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold shadow-2xs"
                        : "border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="text-left">
                        <p className="text-xs font-semibold">{cat.label}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono">
                          {formatAmount(stat.totalAmount, "NGN")}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] font-mono">
                      {stat.count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-[var(--color-border)] flex items-center justify-between bg-[var(--color-surface-muted)]">
              <button
                onClick={() => {
                  setSelectedStatus("ALL");
                  setSearchQuery("");
                  setIsFilterModalOpen(false);
                }}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline cursor-pointer"
              >
                Reset to all quotes
              </button>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-xl hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
