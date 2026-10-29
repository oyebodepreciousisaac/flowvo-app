"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatAmount } from "@/lib/currency";
import { JobCardAction } from "./JobCardAction";
import {
  Search,
  SlidersHorizontal,
  X,
  Briefcase,
  Calendar,
  Phone,
  Mail,
  CheckCircle2,
  Clock,
  PlayCircle,
  FolderOpen,
} from "lucide-react";

export interface JobItemData {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  amount: number;
  currency: string;
  scheduledDate: string | null;
  status: string;
  createdAt: string;
  invoices: { id: string }[];
}

interface JobsViewProps {
  initialJobs: JobItemData[];
}

const JOB_CATEGORIES = [
  { key: "ALL", label: "All Jobs", icon: Briefcase },
  { key: "SCHEDULED", label: "Scheduled", icon: Calendar },
  { key: "IN_PROGRESS", label: "In Progress", icon: PlayCircle },
  { key: "COMPLETE", label: "Completed", icon: CheckCircle2 },
] as const;

export function JobsView({ initialJobs }: JobsViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Calculate counts and financial sums per status
  const stats = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {
      ALL: { count: initialJobs.length, totalAmount: 0 },
    };

    for (const cat of JOB_CATEGORIES) {
      if (cat.key !== "ALL") {
        map[cat.key] = { count: 0, totalAmount: 0 };
      }
    }

    for (const j of initialJobs) {
      map.ALL.totalAmount += j.amount;
      if (map[j.status]) {
        map[j.status].count += 1;
        map[j.status].totalAmount += j.amount;
      }
    }

    return map;
  }, [initialJobs]);

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialJobs.filter((job) => {
      const matchesStatus = selectedStatus === "ALL" || job.status === selectedStatus;
      if (!matchesStatus) return false;

      if (!query) return true;
      return (
        job.customerName.toLowerCase().includes(query) ||
        job.customerEmail.toLowerCase().includes(query) ||
        job.customerPhone.toLowerCase().includes(query) ||
        job.description.toLowerCase().includes(query)
      );
    });
  }, [initialJobs, searchQuery, selectedStatus]);

  const activeCategory = JOB_CATEGORIES.find((c) => c.key === selectedStatus) || JOB_CATEGORIES[0];

  return (
    <div className="space-y-5">
      {/* Search Bar & Categories Modal Trigger */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search jobs by client, phone, email, description..."
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

      {/* Horizontal Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-medium border-b border-[var(--color-border)]">
        {JOB_CATEGORIES.map((cat) => {
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
              Showing <strong>{filteredJobs.length}</strong> {filteredJobs.length === 1 ? "job" : "jobs"}
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

      {/* Jobs Grid or Empty State */}
      {filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-md mx-auto my-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)] mb-1">
            No jobs found
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {searchQuery
              ? `No jobs match "${searchQuery}" in ${activeCategory.label}.`
              : `There are currently no jobs under ${activeCategory.label}.`}
          </p>
          {(searchQuery || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              View all jobs
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const isComplete = job.status === "COMPLETE";
            const formattedAmount = formatAmount(job.amount, job.currency || "NGN");

            return (
              <div
                key={job.id}
                className={`flex flex-col justify-between rounded-xl border bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5 transition-shadow hover:shadow-md ${
                  isComplete ? "border-[var(--color-border)] opacity-90" : "border-[var(--color-border)]"
                }`}
              >
                <div>
                  {/* Top row: Status chip & Scheduled Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusChip status={job.status as any} />
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] font-medium">
                      <Calendar className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      {job.scheduledDate
                        ? new Date(job.scheduledDate).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          })
                        : "Unscheduled"}
                    </span>
                  </div>

                  {/* Customer Name & Link */}
                  <Link href={`/jobs/${job.id}`} className="group block">
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {job.customerName}
                    </h3>
                  </Link>

                  {/* Service Description */}
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)] line-clamp-2">
                    {job.description}
                  </p>

                  {/* Amount */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
                    <span className="text-xs text-[var(--color-text-muted)]">Job Amount:</span>
                    <span className="font-mono text-base font-bold text-[var(--color-primary)]">
                      {formattedAmount}
                    </span>
                  </div>

                  {/* Contact details */}
                  <div className="mt-3 pt-2 border-t border-[var(--color-border)] flex items-center justify-between gap-2 text-[11px] sm:text-xs text-[var(--color-text-secondary)] flex-wrap">
                    <a
                      href={`tel:${job.customerPhone}`}
                      className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors shrink-0"
                    >
                      <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span>{job.customerPhone}</span>
                    </a>
                    <a
                      href={`mailto:${job.customerEmail}`}
                      className="inline-flex items-center gap-1 hover:text-[var(--color-primary)] transition-colors truncate max-w-[150px] xs:max-w-[200px]"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className="truncate">{job.customerEmail}</span>
                    </a>
                  </div>
                </div>

                {/* Primary Action Button Per Status */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/jobs/${job.id}`}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View details
                  </Link>

                  <JobCardAction
                    jobId={job.id}
                    customerName={job.customerName}
                    amountFormatted={formattedAmount}
                    status={job.status}
                    invoiceId={job.invoices[0]?.id}
                  />
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
                <h3 className="font-bold text-sm">Job Categories &amp; Workflow</h3>
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
                Select a stage to view jobs or inspect scheduled pipelines.
              </p>

              {JOB_CATEGORIES.map((cat) => {
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
                Reset to all jobs
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
