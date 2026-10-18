import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { CopyButton } from "./CopyButton";
import { UserPlus, ArrowRight, Phone, Mail, FileText, Briefcase, ExternalLink } from "lucide-react";

export const metadata: Metadata = { title: "Leads — Settlevo" };

export default async function LeadsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const business = session.user.business;
  const leads = await prisma.lead.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

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

      {/* Main Content: Empty State or Leads List */}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {leads.map((lead) => {
            const isLost = lead.status === "LOST";
            const isWon = lead.status === "WON";
            const isQuoted = lead.status === "QUOTED";

            return (
              <div
                key={lead.id}
                className={`flex flex-col justify-between rounded-[var(--radius-md)] border bg-[var(--color-surface)] shadow-[var(--shadow-card)] p-5 transition-shadow hover:shadow-md ${
                  isLost ? "border-[var(--color-border)] opacity-75" : "border-[var(--color-border)]"
                }`}
              >
                <div>
                  {/* Top row: Status chip & Date */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <StatusChip status={lead.status} />
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Customer Name & Link */}
                  <Link
                    href={`/leads/${lead.id}`}
                    className="group block"
                  >
                    <h3 className="text-base font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors truncate">
                      {lead.customerName}
                    </h3>
                  </Link>

                  {/* Service Type badge/pill */}
                  <div className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
                    {lead.serviceType}
                  </div>

                  {/* Brief description snippet */}
                  <p className="mt-2 text-xs text-[var(--color-text-muted)] line-clamp-2 leading-relaxed">
                    {lead.description}
                  </p>

                  {/* Contact details */}
                  <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex flex-col gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span>{lead.phone}</span>
                    </a>
                    <a
                      href={`mailto:${lead.email}`}
                      className="inline-flex items-center gap-2 hover:text-[var(--color-primary)] transition-colors truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  </div>
                </div>

                {/* Primary Action Button Per Status per DESIGN.md */}
                <div className="mt-5 pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-2">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
                  >
                    View details
                  </Link>

                  {/* Action according to status: NEW/CONTACTED -> Create quote; QUOTED -> View quote; WON -> View job; LOST -> none */}
                  {!isLost && !isWon && !isQuoted && (
                    <Link
                      href={`/quotes/new?leadId=${lead.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white transition-colors"
                    >
                      <span>Create quote</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  )}

                  {isQuoted && (
                    <Link
                      href="/quotes"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] hover:bg-[var(--color-border)] text-[var(--color-text)] transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>View quote</span>
                    </Link>
                  )}

                  {isWon && (
                    <Link
                      href="/jobs"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] hover:bg-[#d6ece7] text-[var(--color-primary)] transition-colors"
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
    </div>
  );
}
