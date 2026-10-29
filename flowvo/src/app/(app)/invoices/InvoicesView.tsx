"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { StatusChip } from "@/components/ui/StatusChip";
import { formatAmount, convertCurrency } from "@/lib/currency";
import { buildInvoicePaymentReminderWhatsAppUrl } from "@/lib/whatsapp";
import {
  Search,
  SlidersHorizontal,
  X,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  MessageCircle,
  ArrowRight,
  Send,
  FileEdit,
  FolderOpen,
} from "lucide-react";

export interface InvoiceItemData {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  currency: string;
  status: string;
  dueDate: string;
  sentAt: string | null;
  paidAt: string | null;
  createdAt: string;
  emailDeliveryStatus?: string | null;
  customerPhone: string | null;
}

interface InvoicesViewProps {
  initialInvoices: InvoiceItemData[];
  businessCurrency: string;
  businessName: string;
}

const INVOICE_CATEGORIES = [
  { key: "ALL", label: "All Invoices", icon: FileText },
  { key: "OVERDUE", label: "Overdue", icon: AlertTriangle },
  { key: "SENT", label: "Awaiting Payment", icon: Send },
  { key: "DRAFT", label: "Drafts", icon: FileEdit },
  { key: "PAID", label: "Paid", icon: CheckCircle2 },
] as const;

export function InvoicesView({
  initialInvoices,
  businessCurrency,
  businessName,
}: InvoicesViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Stats calculation
  const stats = useMemo(() => {
    const map: Record<string, { count: number; totalAmount: number }> = {
      ALL: { count: initialInvoices.length, totalAmount: 0 },
    };

    for (const cat of INVOICE_CATEGORIES) {
      if (cat.key !== "ALL") {
        map[cat.key] = { count: 0, totalAmount: 0 };
      }
    }

    for (const inv of initialInvoices) {
      const converted = convertCurrency(inv.total, inv.currency || businessCurrency, businessCurrency);
      map.ALL.totalAmount += converted;
      if (map[inv.status]) {
        map[inv.status].count += 1;
        map[inv.status].totalAmount += converted;
      }
    }

    return map;
  }, [initialInvoices, businessCurrency]);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return initialInvoices.filter((inv) => {
      const matchesStatus = selectedStatus === "ALL" || inv.status === selectedStatus;
      if (!matchesStatus) return false;

      if (!query) return true;
      return (
        inv.invoiceNumber.toLowerCase().includes(query) ||
        inv.customerName.toLowerCase().includes(query) ||
        inv.customerEmail.toLowerCase().includes(query) ||
        (inv.customerPhone && inv.customerPhone.toLowerCase().includes(query))
      );
    });
  }, [initialInvoices, searchQuery, selectedStatus]);

  const activeCategory = INVOICE_CATEGORIES.find((c) => c.key === selectedStatus) || INVOICE_CATEGORIES[0];

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
            placeholder="Search invoices by invoice #, client, email, phone..."
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
        {INVOICE_CATEGORIES.map((cat) => {
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
              Showing <strong>{filteredInvoices.length}</strong> {filteredInvoices.length === 1 ? "invoice" : "invoices"}
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

      {/* Invoices List or Empty State */}
      {filteredInvoices.length === 0 ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-md mx-auto my-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] mb-3">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[var(--color-text)] mb-1">
            No invoices found
          </h3>
          <p className="text-xs text-[var(--color-text-muted)] mb-4">
            {searchQuery
              ? `No invoices match "${searchQuery}" in ${activeCategory.label}.`
              : `There are currently no invoices under ${activeCategory.label}.`}
          </p>
          {(searchQuery || selectedStatus !== "ALL") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedStatus("ALL");
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors cursor-pointer"
            >
              View all invoices
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const isOverdue = invoice.status === "OVERDUE";
            const isDraft = invoice.status === "DRAFT";
            const isSent = invoice.status === "SENT";
            const dueDateStr = new Date(invoice.dueDate).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });

            const reminderUrl = invoice.customerPhone
              ? buildInvoicePaymentReminderWhatsAppUrl({
                  customerPhone: invoice.customerPhone,
                  customerName: invoice.customerName,
                  businessName,
                  invoiceNumber: invoice.invoiceNumber,
                  invoiceTotalFormatted: formatAmount(invoice.total, invoice.currency || businessCurrency),
                  dueDateFormatted: dueDateStr,
                  invoiceUrl: `/invoices/view/${invoice.id}`,
                  isOverdue,
                })
              : null;

            return (
              <div
                key={invoice.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border bg-[var(--color-surface)] shadow-[var(--shadow-card)] transition-shadow hover:shadow-md ${
                  isOverdue
                    ? "border-l-4 border-l-[var(--color-error)] border-[var(--color-border)]"
                    : "border-[var(--color-border)]"
                }`}
              >
                {/* Left: Invoice Number, Customer, Due Date */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <span className="font-mono text-[11px] sm:text-xs font-bold text-[var(--color-text-secondary)] bg-[var(--color-surface-muted)] px-1.5 sm:px-2 py-0.5 rounded border border-[var(--color-border)] shrink-0">
                      {invoice.invoiceNumber}
                    </span>
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className="text-sm sm:text-base font-bold text-[var(--color-text)] hover:text-[var(--color-primary)] transition-colors truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none"
                    >
                      {invoice.customerName}
                    </Link>
                    <StatusChip status={invoice.status as any} />
                    {isSent && invoice.emailDeliveryStatus === "BOUNCED" && (
                      <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--color-status-overdue)] text-[var(--color-error)] border border-[#f8b4b4] shrink-0">
                        Bounced
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-xs text-[var(--color-text-secondary)] flex-wrap">
                    <span className="truncate max-w-[170px] xs:max-w-[240px] sm:max-w-none">{invoice.customerEmail}</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[var(--color-text-muted)] shrink-0" />
                      <span className={isOverdue ? "text-[var(--color-error)] font-medium" : ""}>
                        Due: {dueDateStr}
                      </span>
                    </span>
                    {invoice.paidAt && (
                      <span className="text-[var(--color-primary)] font-medium shrink-0">
                        Paid: {new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Action Link */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)] shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="font-mono text-base sm:text-lg font-bold text-[var(--color-text)] block">
                      {formatAmount(invoice.total, invoice.currency || businessCurrency)}
                    </span>
                    {invoice.currency && invoice.currency.toUpperCase() !== businessCurrency.toUpperCase() && (
                      <span className="text-[10px] sm:text-[11px] text-[var(--color-primary)] font-mono font-semibold block">
                        ≈ {formatAmount(convertCurrency(invoice.total, invoice.currency, businessCurrency), businessCurrency)}
                      </span>
                    )}
                    <span className="text-[10px] sm:text-[11px] text-[var(--color-text-muted)] block">
                      {isDraft ? "Draft" : isSent ? "Awaiting payment" : isOverdue ? "Past due" : "Paid"}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {reminderUrl && (isOverdue || isSent) && (
                      <a
                        href={reminderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1.5 sm:px-2.5 sm:py-2 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors shadow-2xs"
                        title="Send 1-click WhatsApp payment reminder to customer"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>
                    )}

                    <Link
                      href={`/invoices/${invoice.id}`}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                        isDraft
                          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                          : isOverdue || isSent
                          ? "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]"
                          : "bg-[var(--color-surface-muted)] text-[var(--color-text)] hover:bg-[var(--color-border)]"
                      }`}
                    >
                      <span>
                        <span className="sm:hidden">{isDraft ? "Review" : isOverdue || isSent ? "Manage" : "View"}</span>
                        <span className="hidden sm:inline">{isDraft ? "Review & send" : isOverdue || isSent ? "Manage & pay" : "View"}</span>
                      </span>
                      <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    </Link>
                  </div>
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
                <h3 className="font-bold text-sm">Invoice Categories &amp; Financials</h3>
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
                Filter by payment status or view converted totals in your business currency ({businessCurrency}).
              </p>

              {INVOICE_CATEGORIES.map((cat) => {
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
                          {formatAmount(stat.totalAmount, businessCurrency)}
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
                Reset to all invoices
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
