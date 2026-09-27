import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { QuoteEditor } from "./QuoteEditor";
import { ArrowLeft, UserCheck } from "lucide-react";

export const metadata: Metadata = { title: "New Quote — Flowvo" };

interface PageProps {
  searchParams: Promise<{ leadId?: string }>;
}

export default async function NewQuotePage({ searchParams }: PageProps) {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const { leadId } = await searchParams;

  let lead = null;
  if (leadId) {
    lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        businessId: session.user.businessId,
      },
    });
  }

  // If no lead found by param, fetch recent leads to offer selection
  const availableLeads = !lead
    ? await prisma.lead.findMany({
        where: { businessId: session.user.businessId },
        orderBy: { createdAt: "desc" },
        take: 15,
      })
    : [];

  return (
    <div className="space-y-6 max-w-[var(--container-narrow)]">
      {/* Back button */}
      <div>
        <Link
          href={leadId ? `/leads/${leadId}` : "/quotes"}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{leadId ? "Back to Lead" : "Back to Quotes"}</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">
          Create New Quote
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Build an itemized quote for your customer with zero re-entry of customer data.
        </p>
      </div>

      {lead ? (
        <QuoteEditor
          lead={{
            id: lead.id,
            customerName: lead.customerName,
            email: lead.email,
            phone: lead.phone,
            serviceType: lead.serviceType,
          }}
        />
      ) : (
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)] space-y-4">
          <h2 className="text-sm font-semibold text-[var(--color-text)]">
            Select an enquiry / lead to quote:
          </h2>
          {availableLeads.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-[var(--color-text-muted)] mb-4">
                You have no enquiries in your database yet.
              </p>
              <Link
                href="/leads"
                className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-semibold rounded-[var(--radius-md)]"
              >
                Go to Leads
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {availableLeads.map((l) => (
                <div
                  key={l.id}
                  className="py-3 flex items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-[var(--color-text)]">
                      {l.customerName}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {l.serviceType} · {l.email}
                    </p>
                  </div>
                  <Link
                    href={`/quotes/new?leadId=${l.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-[var(--radius-md)] bg-[var(--color-primary-subtle)] text-[var(--color-primary)] hover:bg-[#d6ece7] transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Create quote</span>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
