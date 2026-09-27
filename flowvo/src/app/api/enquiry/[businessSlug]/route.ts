import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { leadAcknowledgementHtml, leadAcknowledgementText } from "@/lib/email-templates/lead-ack";

// ─── Rate limit store (in-memory; fine for single-process dev/Vercel cold-start)
// In production with multiple Vercel instances this is per-instance.
// Spec defers Redis until v2; this satisfies the exit condition for single-instance.
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT_MAX) return false; // blocked
  entry.count++;
  return true; // allowed
}

// ─── Validation schema
const enquirySchema = z.object({
  firstName:   z.string().min(1, "First name is required").max(80),
  lastName:    z.string().min(1, "Last name is required").max(80),
  phone:       z.string().min(6, "Phone number is required").max(30),
  email:       z.string().email("A valid email is required"),
  serviceType: z.string().min(1, "Service type is required").max(120),
  description: z.string().min(10, "Please give a brief description (at least 10 characters)").max(2000),
  source:      z.string().max(80).optional(),
  turnstileToken: z.string().optional(),
});

// ─── POST /api/enquiry/[businessSlug]
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ businessSlug: string }> }
) {
  const { businessSlug } = await context.params;
  // Rate limit by IP
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again in an hour." },
      { status: 429 }
    );
  }

  // Find business
  const business = await prisma.business.findUnique({
    where: { slug: businessSlug },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  // Validate
  const result = enquirySchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed.", fields: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  // Verify Turnstile if secret is configured
  if (process.env.TURNSTILE_SECRET_KEY) {
    const token = result.data.turnstileToken;
    if (!token) {
      return NextResponse.json(
        { error: "Security check failed. Please refresh and try again." },
        { status: 400 }
      );
    }
    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: token,
          remoteip: ip,
        }),
      });
      const outcome = await verifyRes.json();
      if (!outcome.success) {
        return NextResponse.json(
          { error: "Security check failed. Please refresh and try again." },
          { status: 400 }
        );
      }
    } catch {
      // If external verification call fails, we log and proceed or reject
      console.warn("Turnstile verification error");
    }
  }

  const { firstName, lastName, phone, email, serviceType, description, source } = result.data;
  const customerName = `${firstName} ${lastName}`.trim();

  // Create Lead
  const lead = await prisma.lead.create({
    data: {
      businessId:   business.id,
      customerName,
      phone,
      email,
      serviceType,
      description,
      source:       source ?? null,
      status:       "NEW",
    },
  });

  // Log lead.created
  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      leadId:     lead.id,
      entityType: "lead",
      entityId:   lead.id,
      eventType:  "lead.created",
      status:     "SUCCESS",
    },
  });

  // Send acknowledgement email
  const emailResult = await sendEmail({
    to:       email,
    replyTo:  business.email,
    subject:  `We've received your enquiry — ${business.name}`,
    html:     leadAcknowledgementHtml({ firstName, businessName: business.name, serviceType }),
    text:     leadAcknowledgementText({ firstName, businessName: business.name, serviceType }),
  });

  // Log email result
  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      leadId:     lead.id,
      entityType: "lead",
      entityId:   lead.id,
      eventType:  emailResult.success ? "ack.sent" : "ack.failed",
      status:     emailResult.success ? "SUCCESS" : "FAILURE",
      detail:     emailResult.success ? null : emailResult.error,
    },
  });

  return NextResponse.json({ ok: true, leadId: lead.id }, { status: 201 });
}
