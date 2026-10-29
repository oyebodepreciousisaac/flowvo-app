"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import {
  Search,
  Filter,
  X,
  UserPlus,
  Phone,
  Mail,
  FileText,
  Briefcase,
  ArrowRight,
  SlidersHorizontal,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";

export interface LeadItem {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceType: string;
  description: string;
  status: string;
  createdAt: string | Date;
}

interface LeadsViewProps {
  initialLeads: LeadItem[];
  businessSlug: string;
}

const STATUS_CATEGORIES = [
  { key: "ALL", label: "All Leads", color: "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200" },
  { key: "NEW", label: "New", color: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300" },
  { key: "CONTACTED", label: "Contacted", color: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300" },
  { key: "QUOTED", label: "Quoted", color: "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" },
  { key: "WON", label: "Won", color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" },
  { key: "LOST", label: "Lost", color: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300" },
] as const;

export function LeadsView({ initialLeads, businessSlug }: LeadsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Compute counts per category
  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: initialLeads.length };
    for (const cat of STATUS_CATEGORIES) {
      if (cat.key !== "ALL") {
        map[cat.key] = initialLeads.filter((l) => l.status === cat.key).length;
      }
    }
    return map;
  }, [initialLeads]);

  // Filtered leads based on search and selected status category
  const filteredLeads = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialLeads.filter((lead) => {
      const matchesStatus = selectedStatus === "ALL" || lead.status === selectedStatus;
      if (!matchesStatus) return false;

      if (!query) return true;
      return (
        lead.customerName.toLowerCase().includes(query) ||
        lead.email.toLowerCase().includes(query) ||
        lead.phone.toLowerCase().includes(query) ||
        lead.serviceType.toLowerCase().includes(query) ||
        lead.description.toLowerCase().includes(query)
      );
    });
  }, [initialLeads, searchQuery, selectedStatus]);

  const activeCategory = STATUS_CATEGORIES.find((c) => c.key === selectedStatus) || STATUS_CATEGORIES[0];

  return (
    <div className="space-y-5">
      {/* Search Bar & Filter Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with instant clear */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search leads by name, email, phone, service..."
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

        {/* Filter category button that opens category breakdown modal */}
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
        {STATUS_CATEGORIES.map((cat) => {
          const isSelected = selectedStatus === cat.key;
          const count = counts[cat.key] || 0;
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
                {count}
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
              Showing <strong>{filteredLeads.length}</strong> {filteredLeads.length === 1 ? "lead" : "leads"}
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

      {/* Leads List / Grid */}
      {filteredLeads.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-md mx-auto my-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)] mb-1">
            No leads found
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {searchQuery
              ? `No leads match "${searchQuery}" in ${activeCategory.label}.`
              : `There are currently no leads categorized as ${activeCategory.label}.`}
          </p>
          {(searchQuery || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              View all leads
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLeads.map((lead) => {
            const isLost = lead.status === "LOST";
            const isWon = lead.status === "WON";
            const isQuoted = lead.status === "QUOTED";

            return (
              <div
                key={lead.id}
                className={`flex flex-col justify-between rounded-xl border bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5 transition-shadow hover:shadow-md ${
                  isLost ? "border-[var(--color-border)] opacity-75" : "border-[var(--color-border)]"
                }`}
              >
                <div>
                  {/* Top row: Status chip & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusChip status={lead.status as any} />
                    <span className="text-[11px] text-[var(--color-text-muted)]">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Customer Name & Link */}
                  <Link href={`/leads/${lead.id}`} className="group block">
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {lead.customerName}
                    </h3>
                  </Link>

                  {/* Service Type badge */}
                  <div className="mt-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    {lead.serviceType}
                  </div>

                  {/* Description snippet */}
                  <p className="mt-2 text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                    {lead.description}
                  </p>

                  {/* Contact details */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate">{lead.phone}</span>
                    </a>
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  </div>
                </div>

                {/* Primary Action Button Per Status */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View details
                  </Link>

                  {!isLost && !isWon && !isQuoted && (
                    <Link
                      href={`/quotes/new?leadId=${lead.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors"
                    >
                      <span>Create quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {isQuoted && (
                    <Link
                      href="/quotes"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View quote</span>
                    </Link>
                  )}

                  {isWon && (
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
                <Filter className="w-4 h-4 text-[var(--color-primary)]" />
                <h3 className="font-bold text-sm">Filter Leads by Category</h3>
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
                Select a category to isolate specific leads and avoid continuous scrolling.
              </p>

              {STATUS_CATEGORIES.map((cat) => {
                const isSelected = selectedStatus === cat.key;
                const count = counts[cat.key] || 0;
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
                      <span className="text-xs">{cat.label}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[var(--color-primary)]" />}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] font-mono">
                      {count} {count === 1 ? "lead" : "leads"}
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
                Reset to all leads
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
