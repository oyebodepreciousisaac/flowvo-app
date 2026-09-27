import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — Flowvo",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)] mb-6">Dashboard</h1>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center shadow-[var(--shadow-card)]">
        <p className="text-[var(--color-text-muted)] text-sm">
          Dashboard actions will appear here in Slice 7.
        </p>
      </div>
    </div>
  );
}
