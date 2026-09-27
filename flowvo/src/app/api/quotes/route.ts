import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const lineItemSchema = z.object({
  id: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than zero"),
  unitPricePence: z.number().int().min(0, "Unit price must be non-negative"),
  lineTotalPence: z.number().int().min(0, "Line total must be non-negative"),
});

const createQuoteSchema = z.object({
  leadId: z.string().min(1, "Lead ID is required"),
  lineItems: z.array(lineItemSchema).min(1, "At least one line item is required"),
});

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = createQuoteSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { leadId, lineItems } = result.data;

  // Validate lead belongs to user's business
  const lead = await prisma.lead.findFirst({
    where: {
      id: leadId,
      businessId: session.user.businessId,
    },
  });

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Calculate totals
  const subtotal = lineItems.reduce((acc, item) => acc + item.lineTotalPence, 0);
  const total = subtotal;

  // Generate unique quoteToken (12 random hex characters)
  const quoteToken = crypto.randomBytes(8).toString("hex");

  // Create Quote
  const quote = await prisma.quote.create({
    data: {
      leadId: lead.id,
      businessId: session.user.businessId,
      quoteToken,
      lineItems: JSON.stringify(lineItems),
      subtotal,
      total,
      status: "DRAFT",
    },
  });

  // If lead is NEW, move to QUOTED or CONTACTED
  if (lead.status === "NEW") {
    await prisma.lead.update({
      where: { id: lead.id },
      data: { status: "CONTACTED" },
    });
  }

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: session.user.businessId,
      leadId: lead.id,
      quoteId: quote.id,
      entityType: "quote",
      entityId: quote.id,
      eventType: "quote.created",
      status: "SUCCESS",
      detail: `Quote draft created for ${(total / 100).toLocaleString("en-GB", { style: "currency", currency: "GBP" })}`,
    },
  });

  return NextResponse.json({ ok: true, quoteId: quote.id, quoteToken }, { status: 201 });
}
