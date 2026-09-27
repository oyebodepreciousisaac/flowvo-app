import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUOTED", "WON", "LOST"]).optional(),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const lead = await prisma.lead.findFirst({
    where: {
      id,
      businessId: session.user.businessId,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: result.data,
  });

  // If status changed, log to activity log
  if (result.data.status && result.data.status !== lead.status) {
    await prisma.activityLog.create({
      data: {
        businessId: session.user.businessId,
        leadId: id,
        entityType: "lead",
        entityId: id,
        eventType: `lead.status_${result.data.status.toLowerCase()}`,
        status: "SUCCESS",
        detail: `Status changed from ${lead.status} to ${result.data.status}`,
      },
    });
  }

  return NextResponse.json({ ok: true, lead: updated });
}
