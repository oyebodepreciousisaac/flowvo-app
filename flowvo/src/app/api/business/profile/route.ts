import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin, encryptField, decryptField } from "@/lib/security";
import { isValidGoogleReviewUrl } from "@/lib/review";

const profileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  email: z.string().email("A valid business email is required"),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  country: z.string().max(10).optional().default("GB"),
  currency: z.string().max(6).optional().default("GBP"),
  paymentGateway: z.enum(["MANUAL", "PAYSTACK", "STRIPE"]).optional().default("MANUAL"),
  paystackPublicKey: z.string().max(200).optional().nullable(),
  paystackSecretKey: z.string().max(200).optional().nullable(),
  stripePublishableKey: z.string().max(200).optional().nullable(),
  stripeSecretKey: z.string().max(200).optional().nullable(),
  paymentsEnabled: z.boolean().optional().default(false),
  paymentDetails: z.string().max(2000).optional().nullable(),
  quoteFollowUpDelayDays: z.coerce.number().int().min(1, "Must be at least 1 day").max(7, "Must be at most 7 days").optional(),
  reviewReminderDelayDays: z.coerce.number().int().min(1, "Must be at least 1 day").max(7, "Must be at most 7 days").optional(),
  logoUrl: z.string().max(1000).optional().nullable(),
  notificationPhone: z.string().max(50).optional().nullable(),
  bankName: z.string().max(100).optional().nullable(),
  bankCode: z.string().max(50).optional().nullable(),
  bankAccountNumber: z.string().max(50).optional().nullable(),
  bankAccountName: z.string().max(100).optional().nullable(),
  googleReviewUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === "" || isValidGoogleReviewUrl(val),
      "Must be a valid Google review link (e.g. https://g.page/r/... or https://maps.app.goo.gl/...)"
    ),
});

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const result = profileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const currentBusiness = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  });

  const encryptedPaymentDetails = result.data.paymentDetails
    ? encryptField(result.data.paymentDetails)
    : result.data.paymentDetails;

  // Encrypt gateway secret keys if provided, or preserve existing if not altered
  let paystackSecretKey = currentBusiness?.paystackSecretKey;
  if (result.data.paystackSecretKey !== undefined) {
    paystackSecretKey = result.data.paystackSecretKey
      ? encryptField(result.data.paystackSecretKey)
      : null;
  }

  let stripeSecretKey = currentBusiness?.stripeSecretKey;
  if (result.data.stripeSecretKey !== undefined) {
    stripeSecretKey = result.data.stripeSecretKey
      ? encryptField(result.data.stripeSecretKey)
      : null;
  }

  const updated = await prisma.business.update({
    where: { id: session.user.businessId },
    data: {
      name: result.data.name,
      email: result.data.email,
      phone: result.data.phone ?? null,
      address: result.data.address ?? null,
      country: result.data.country ?? "GB",
      currency: result.data.currency ?? "GBP",
      paymentGateway: result.data.paymentGateway ?? "MANUAL",
      paystackPublicKey: result.data.paystackPublicKey ?? null,
      paystackSecretKey,
      stripePublishableKey: result.data.stripePublishableKey ?? null,
      stripeSecretKey,
      paymentsEnabled: result.data.paymentsEnabled ?? false,
      paymentDetails: encryptedPaymentDetails,
      quoteFollowUpDelayDays: result.data.quoteFollowUpDelayDays ?? 3,
      reviewReminderDelayDays: result.data.reviewReminderDelayDays ?? 4,
      googleReviewUrl: result.data.googleReviewUrl ? result.data.googleReviewUrl.trim() : null,
      logoUrl: result.data.logoUrl !== undefined ? (result.data.logoUrl?.trim() || null) : currentBusiness?.logoUrl,
      notificationPhone: result.data.notificationPhone !== undefined ? (result.data.notificationPhone?.trim() || null) : currentBusiness?.notificationPhone,
      bankName: result.data.bankName !== undefined ? (result.data.bankName?.trim() || null) : currentBusiness?.bankName,
      bankCode: result.data.bankCode !== undefined ? (result.data.bankCode?.trim() || null) : currentBusiness?.bankCode,
      bankAccountNumber: result.data.bankAccountNumber !== undefined ? (result.data.bankAccountNumber?.trim() || null) : currentBusiness?.bankAccountNumber,
      bankAccountName: result.data.bankAccountName !== undefined ? (result.data.bankAccountName?.trim() || null) : currentBusiness?.bankAccountName,
    },
  });

  return NextResponse.json({
    ok: true,
    business: {
      ...updated,
      paystackSecretKey: updated.paystackSecretKey ? "••••••••" : null,
      stripeSecretKey: updated.stripeSecretKey ? "••••••••" : null,
      hasPaystackSecret: !!updated.paystackSecretKey,
      hasStripeSecret: !!updated.stripeSecretKey,
      paymentDetails: decryptField(updated.paymentDetails),
    },
  });
}
