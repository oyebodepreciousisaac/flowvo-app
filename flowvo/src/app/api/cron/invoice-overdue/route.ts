import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}

async function handleCron(request: NextRequest) {
  // CRON_SECRET verification
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const xCronSecret = request.headers.get("x-cron-secret");

  const providedSecret =
    authHeader?.replace(/^Bearer\s+/i, "") ?? xCronSecret;

  if (cronSecret && providedSecret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // If in production and CRON_SECRET is not configured at all, protect it
  if (!cronSecret && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "CRON_SECRET not configured on server" },
      { status: 500 }
    );
  }

  // Query: status = SENT AND dueDate < NOW()
  const now = new Date();

  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: "SENT",
      dueDate: {
        lt: now,
      },
    },
  });

  let updatedCount = 0;
  const updatedIds: string[] = [];

  for (const invoice of overdueInvoices) {
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: {
        status: "OVERDUE",
      },
    });

    await prisma.activityLog.create({
      data: {
        businessId: invoice.businessId,
        leadId: invoice.leadId,
        quoteId: invoice.quoteId,
        jobId: invoice.jobId,
        invoiceId: invoice.id,
        entityType: "invoice",
        entityId: invoice.id,
        eventType: "invoice.overdue",
        status: "SUCCESS",
        detail: `Invoice ${invoice.invoiceNumber} marked OVERDUE (past due date ${invoice.dueDate.toISOString().split("T")[0]})`,
      },
    });

    updatedCount++;
    updatedIds.push(invoice.id);
  }

  return NextResponse.json({
    ok: true,
    processed: overdueInvoices.length,
    updatedCount,
    updatedIds,
  });
}
