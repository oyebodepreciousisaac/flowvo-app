import type { Metadata } from "next";

export const metadata: Metadata = { title: "Invoices — Flowvo" };

export default function InvoicesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-6">Invoices</h1>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-[var(--color-text-muted)] text-sm">Invoice management will be built in Slice 5.</p>
      </div>
    </div>
  );
}
