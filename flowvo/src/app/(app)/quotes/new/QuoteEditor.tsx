"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, AlertCircle } from "lucide-react";
import { formatAmount, getCurrencySymbol } from "@/lib/currency";

interface LeadData {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  serviceType: string;
}

interface QuoteEditorProps {
  lead: LeadData;
  currency?: string;
}

interface EditableLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceStr: string;
  unitPricePence: number;
  lineTotalPence: number;
}

const TRADE_PRESETS = [
  { label: "Plumbing Repair", desc: "Inspection, diagnostic & pipe leak repair", rate: "35000" },
  { label: "Electrical Wiring", desc: "Socket installation, cabling & circuit check", rate: "25000" },
  { label: "Solar / Inverter", desc: "Solar panel mounting, inverter setup & battery cabling", rate: "75000" },
  { label: "AC Servicing", desc: "Air conditioner full servicing, filter cleaning & gas recharge", rate: "30000" },
  { label: "Painting & Prep", desc: "Wall preparation, crack filling & 2-coat painting", rate: "50000" },
  { label: "Deep Cleaning", desc: "Deep cleaning, disinfection & sanitation service", rate: "25000" },
];

function parsePence(val: string): number {
  const clean = val.replace(/[^0-9.]/g, "");
  const num = parseFloat(clean);
  if (isNaN(num) || num < 0) return 0;
  return Math.round(num * 100);
}

export function QuoteEditor({ lead, currency = "NGN" }: QuoteEditorProps) {
  const router = useRouter();
  const currencySymbol = getCurrencySymbol(currency);

  const [items, setItems] = useState<EditableLineItem[]>([
    {
      id: "item-1",
      description: lead.serviceType || "Standard Service / Labour",
      quantity: 1,
      unitPriceStr: "",
      unitPricePence: 0,
      lineTotalPence: 0,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function applyPreset(preset: typeof TRADE_PRESETS[0]) {
    const pence = parsePence(preset.rate);
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random()}`,
        description: preset.desc,
        quantity: 1,
        unitPriceStr: preset.rate,
        unitPricePence: pence,
        lineTotalPence: pence,
      },
    ]);
  }

  function updateItem(id: string, field: "description" | "quantity" | "unitPriceStr", value: string | number) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;

        const next = { ...item, [field]: value };

        if (field === "quantity") {
          const qty = typeof value === "number" ? value : parseFloat(value as string) || 0;
          next.quantity = qty >= 0 ? qty : 0;
          next.lineTotalPence = Math.round(next.quantity * next.unitPricePence);
        } else if (field === "unitPriceStr") {
          const pence = parsePence(value as string);
          next.unitPricePence = pence;
          next.lineTotalPence = Math.round(next.quantity * pence);
        }

        return next;
      })
    );
  }

  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPriceStr: "",
        unitPricePence: 0,
        lineTotalPence: 0,
      },
    ]);
  }

  function removeItem(id: string) {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  const subtotalPence = items.reduce((acc, item) => acc + item.lineTotalPence, 0);
  const totalPence = subtotalPence;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Validation
    if (!lead.email) {
      setErrorMsg("Customer email is missing on this lead. Please add an email before creating a quote.");
      return;
    }

    if (items.length === 0) {
      setErrorMsg("Please add at least one line item.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.description.trim()) {
        setErrorMsg(`Item #${i + 1} is missing a description.`);
        return;
      }
      if (it.quantity <= 0) {
        setErrorMsg(`Item #${i + 1} must have a quantity greater than zero.`);
        return;
      }
      if (it.unitPricePence <= 0) {
        setErrorMsg(`Item #${i + 1} must have a unit price.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          currency,
          lineItems: items.map((it) => ({
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPricePence: it.unitPricePence,
            lineTotalPence: it.lineTotalPence,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to create quote.");
        return;
      }

      router.push(`/quotes/${data.quoteId}`);
    } catch {
      setErrorMsg("A network error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMsg && (
        <div className="flex items-center gap-2 p-3 text-xs bg-[var(--color-error-bg)] text-[var(--color-error)] rounded-[var(--radius-md)] border border-[#f8b4b4]">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Customer Pre-filled details (Read-only) */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)] space-y-3">
        <h2 className="text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)]">
          Customer & Lead Details (Pre-filled)
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="block text-[var(--color-text-muted)] mb-0.5">Customer Name</span>
            <span className="font-semibold text-sm text-[var(--color-text)]">{lead.customerName}</span>
          </div>
          <div>
            <span className="block text-[var(--color-text-muted)] mb-0.5">Email</span>
            <span className="font-medium text-[var(--color-text)]">{lead.email}</span>
          </div>
          <div>
            <span className="block text-[var(--color-text-muted)] mb-0.5">Phone</span>
            <span className="font-medium text-[var(--color-text)]">{lead.phone}</span>
          </div>
          <div>
            <span className="block text-[var(--color-text-muted)] mb-0.5">Requested Service</span>
            <span className="font-medium text-[var(--color-text)]">{lead.serviceType}</span>
          </div>
        </div>
      </div>

      {/* Line Items Editor */}
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
          <div>
            <h2 className="text-sm font-semibold text-[var(--color-text)] uppercase tracking-wider">
              Line Items
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Specify itemized descriptions, quantities, and rates.
            </p>
          </div>
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-primary)] bg-[var(--color-primary-subtle)] hover:bg-[#d6ece7] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add row</span>
          </button>
        </div>

        {/* Trade quick presets chips */}
        <div className="space-y-1.5 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)]/50 border border-[var(--color-border)]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] block">
            Quick Add Trade Presets:
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            {TRADE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary)] transition-colors cursor-pointer shadow-2xs"
              >
                <span>+ {preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] border border-[var(--color-border)]"
            >
              {/* Description */}
              <div className="flex-1 w-full">
                <label className="block sm:hidden text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Supply & fit replacement pump"
                  value={item.description}
                  onChange={(e) => updateItem(item.id, "description", e.target.value)}
                  className="w-full h-9 px-3 text-xs rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                />
              </div>

              {/* Quantity */}
              <div className="w-full sm:w-20">
                <label className="block sm:hidden text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-1">
                  Qty
                </label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  required
                  placeholder="1"
                  value={item.quantity || ""}
                  onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)}
                  className="w-full h-9 px-3 text-xs text-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:border-[var(--color-border-focus)]"
                />
              </div>

              {/* Unit price with Non-Overlapping Input Group */}
              <div className="w-full sm:w-36">
                <label className="block sm:hidden text-[10px] font-semibold text-[var(--color-text-muted)] uppercase mb-1">
                  Unit Price
                </label>
                <div className="flex items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] focus-within:border-[var(--color-border-focus)] overflow-hidden">
                  <span className="inline-flex items-center justify-center px-2.5 h-9 bg-[var(--color-surface-muted)] border-r border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] font-mono select-none flex-shrink-0">
                    {currencySymbol}
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    placeholder="0.00"
                    value={item.unitPriceStr}
                    onChange={(e) => updateItem(item.id, "unitPriceStr", e.target.value)}
                    className="w-full h-9 px-2 text-xs text-right font-mono bg-transparent text-[var(--color-text)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Line total */}
              <div className="w-28 text-right sm:text-right flex items-center justify-between sm:justify-end gap-2">
                <span className="block sm:hidden text-xs text-[var(--color-text-muted)]">Line total:</span>
                <span className="font-mono font-semibold text-xs text-[var(--color-text)]">
                  {formatAmount(item.lineTotalPence, currency)}
                </span>
              </div>

              {/* Remove button */}
              <div>
                <button
                  type="button"
                  disabled={items.length <= 1}
                  onClick={() => removeItem(item.id)}
                  title="Remove item"
                  className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-error)] disabled:opacity-20 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Running Sum Totals Card */}
        <div className="pt-4 border-t border-[var(--color-border)] flex flex-col items-end gap-2 text-sm">
          <div className="flex items-center justify-between w-64 text-[var(--color-text-secondary)]">
            <span>Subtotal:</span>
            <span className="font-mono font-semibold text-[var(--color-text)]">
              {formatAmount(subtotalPence, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between w-64 pt-2 border-t border-[var(--color-border)] text-base font-bold text-[var(--color-text)]">
            <span>Quote Total:</span>
            <span className="font-mono text-lg text-[var(--color-primary)]">
              {formatAmount(totalPence, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2.5 text-xs font-semibold rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)] text-white text-sm font-semibold rounded-[var(--radius-md)] shadow-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Creating draft..." : "Save as draft"}
        </button>
      </div>
    </form>
  );
}
