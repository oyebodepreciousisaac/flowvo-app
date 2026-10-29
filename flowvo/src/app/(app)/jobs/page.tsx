import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { JobsView, type JobItemData } from "./JobsView";

export const metadata: Metadata = { title: "Jobs — Settlevo" };

export default async function JobsPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/login");
  }

  const rawJobs = await prisma.job.findMany({
    where: { businessId: session.user.businessId },
    include: {
      invoices: {
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      { scheduledDate: "asc" },
      { createdAt: "desc" },
    ],
    take: 500,
  });

  const jobs: JobItemData[] = rawJobs.map((j) => ({
    id: j.id,
    customerName: j.customerName,
    customerEmail: j.customerEmail,
    customerPhone: j.customerPhone,
    description: j.description,
    amount: j.amount,
    currency: j.currency || "NGN",
    scheduledDate: j.scheduledDate ? j.scheduledDate.toISOString() : null,
    status: j.status,
    createdAt: j.createdAt.toISOString(),
    invoices: j.invoices.map((inv) => ({ id: inv.id })),
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text)]">Jobs</h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              {jobs.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Active jobs from accepted quotes. Schedule dates and mark complete from your phone or desktop.
          </p>
        </div>
      </div>

      {/* Interactive Jobs View with Search, Filter Tabs & Category Modal */}
      <JobsView initialJobs={jobs} />
    </div>
  );
}
