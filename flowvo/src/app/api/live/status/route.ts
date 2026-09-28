import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const businessId = session.user.businessId;

  try {
    const [latestActivity, newLeads, openQuotes, inProgressJobs, unpaidInvoices] =
      await Promise.all([
        prisma.activityLog.findFirst({
          where: { businessId },
          orderBy: { occurredAt: "desc" },
          select: {
            id: true,
            eventType: true,
            status: true,
            detail: true,
            occurredAt: true,
          },
        }),
        prisma.lead.count({
          where: { businessId, status: "NEW" },
        }),
        prisma.quote.count({
          where: { businessId, status: "SENT" },
        }),
        prisma.job.count({
          where: { businessId, status: "IN_PROGRESS" },
        }),
        prisma.invoice.count({
          where: { businessId, status: { in: ["DRAFT", "SENT", "OVERDUE"] } },
        }),
      ]);

    // Fingerprint string: changes whenever the latest log or any core count changes
    const fingerprint = `${latestActivity?.id || "none"}_${latestActivity?.occurredAt?.getTime() || 0}_${newLeads}_${openQuotes}_${inProgressJobs}_${unpaidInvoices}`;

    return NextResponse.json({
      ok: true,
      timestamp: Date.now(),
      fingerprint,
      latestActivity,
      counts: {
        newLeads,
        openQuotes,
        inProgressJobs,
        unpaidInvoices,
      },
    });
  } catch (error) {
    console.error("Live status check error:", error);
    return NextResponse.json(
      { error: "Failed to fetch live status" },
      { status: 500 }
    );
  }
}
