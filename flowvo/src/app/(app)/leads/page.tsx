import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CopyButton } from "./CopyButton";
import { ExternalLink, UserPlus } from "lucide-react";
import { LeadsView } from "./LeadsView";

export const metadata: Metadata = { title: "Leads — Settlevo" };

export default async function LeadsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const business = session.user.business;
  const rawLeads = await prisma.lead.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  const leads = rawLeads.map((l) => ({
    id: l.id,
    customerName: l.customerName,
    email: l.email,
    phone: l.phone,
    serviceType: l.serviceType,
    description: l.description,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Leads</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {leads.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Incoming customer enquiries and quote opportunities.
          </p>
        </div>

        {/* Public Enquiry Link helper */}
        <div className="flex items-center gap-2">
          <CopyButton
            text={`/enquiry/${business.slug}`}
            label="Copy form link"
          />
          <Link
            href={`/enquiry/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[var(--radius-md)] border border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] transition-colors"
          >
            <span>Preview form</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Content with Search, Filter Tabs & Modal State */}
      {leads.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-[var(--shadow-card)] max-w-xl mx-auto my-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mb-4">
            <UserPlus className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--color-text)] mb-2">No leads yet</h2>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto mb-6">
            Share your enquiry form link with prospective customers to start receiving enquiries straight into your workflow.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <CopyButton
              text={`/enquiry/${business.slug}`}
              label="Copy enquiry form link"
              className="px-4 py-2.5 bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] rounded-[var(--radius-md)] text-sm font-semibold transition-colors"
            />
            <Link
              href={`/enquiry/${business.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-[var(--color-border)] rounded-[var(--radius-md)] text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] transition-colors"
            >
              <span>Test enquiry form</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        <LeadsView initialLeads={leads} businessSlug={business.slug} />
      )}
    </div>
  );
}
