import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuotesView, type QuoteItemData } from "./QuotesView";
import { Plus } from "lucide-react";

export const metadata: Metadata = { title: "Quotes — Settlevo" };

export default async function QuotesPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const rawQuotes = await prisma.quote.findMany({
    where: { businessId: session.user.businessId },
    include: {
      lead: {
        select: {
          id: true,
          customerName: true,
          email: true,
          serviceType: true,
        },
      },
      jobs: {
        select: {
          id: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 500,
  });

  const quotes: QuoteItemData[] = rawQuotes.map((q) => ({
    id: q.id,
    quoteNumber: `Q-${q.id.slice(-6).toUpperCase()}`,
    customerName: q.lead.customerName,
    customerEmail: q.lead.email,
    total: q.total,
    status: q.status,
    quoteToken: q.quoteToken,
    sentAt: q.sentAt ? q.sentAt.toISOString() : null,
    acceptedAt: q.acceptedAt ? q.acceptedAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    lead: { id: q.lead.id, serviceType: q.lead.serviceType },
    jobs: q.jobs.map((j) => ({ id: j.id })),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Quotes</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {quotes.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Itemized quotes sent to customers with automated 3-day reminders and client portals.
          </p>
        </div>

        <div>
          <Link
            href="/quotes/new"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white text-xs font-semibold rounded-[var(--radius-md)] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New quote</span>
          </Link>
        </div>
      </div>

      {/* Interactive Quotes View with Search & Status Modal Filtering */}
      <QuotesView initialQuotes={quotes} />
    </div>
  );
}
