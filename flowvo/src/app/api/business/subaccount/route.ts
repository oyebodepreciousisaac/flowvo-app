import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPaystackSubaccount, resolvePaystackAccountNumber } from "@/lib/paystack";
import { isSameOrigin, encryptField } from "@/lib/security";

export async function POST(request: NextRequest) {
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

  const { bankCode, bankName, accountNumber } =
    (body as { bankCode?: string; bankName?: string; accountNumber?: string }) || {};

  if (!bankCode || !bankName || !accountNumber || accountNumber.trim().length !== 10) {
    return NextResponse.json(
      { error: "Bank name, bank code, and 10-digit NUBAN account number are required." },
      { status: 422 }
    );
  }

  const business = await prisma.business.findUnique({
    where: { id: session.user.businessId },
  });

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  // 1. Resolve and verify account name with Paystack
  const resolveRes = await resolvePaystackAccountNumber({
    accountNumber: accountNumber.trim(),
    bankCode: bankCode.trim(),
  });

  if (!resolveRes.status || !resolveRes.accountName) {
    return NextResponse.json(
      { error: resolveRes.message || "Failed to verify bank account with Paystack." },
      { status: 422 }
    );
  }

  const verifiedAccountName = resolveRes.accountName;

  // 2. Create Paystack Subaccount under Flowvo Master Account
  let subaccountCode: string | null = null;
  try {
    const subRes = await createPaystackSubaccount({
      businessName: business.name,
      settlementBank: bankCode.trim(),
      accountNumber: accountNumber.trim(),
      percentageCharge: 0, // Direct 100% settlement to tradesperson
    });

    if (subRes.status && subRes.data?.subaccount_code) {
      subaccountCode = subRes.data.subaccount_code;
    } else {
      return NextResponse.json(
        { error: subRes.message || "Failed to create Paystack subaccount." },
        { status: 422 }
      );
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error connecting to Paystack API.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 3. Structured bank details formatted for invoice print / email
  const formattedPaymentDetails = `Bank: ${bankName.trim()}
Account Name: ${verifiedAccountName}
Account Number (NUBAN): ${accountNumber.trim()}
Payment Methods: Direct Bank Transfer, Card, or USSD`;

  // 4. Update Business Record
  const updatedBusiness = await prisma.business.update({
    where: { id: business.id },
    data: {
      paystackSubaccountCode: subaccountCode,
      bankName: bankName.trim(),
      bankCode: bankCode.trim(),
      bankAccountNumber: accountNumber.trim(),
      bankAccountName: verifiedAccountName,
      paymentDetails: encryptField(formattedPaymentDetails),
      paymentGateway: "PAYSTACK",
      paymentsEnabled: true,
      country: "NG",
      currency: "NGN",
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      businessId: business.id,
      entityType: "business",
      entityId: business.id,
      eventType: "payment.subaccount_linked",
      status: "SUCCESS",
      detail: `Bank account linked & Paystack Subaccount activated (${bankName} - ${accountNumber} - ${verifiedAccountName})`,
    },
  });

  return NextResponse.json({
    ok: true,
    subaccountCode,
    accountName: verifiedAccountName,
    business: {
      id: updatedBusiness.id,
      bankName: updatedBusiness.bankName,
      bankAccountNumber: updatedBusiness.bankAccountNumber,
      bankAccountName: updatedBusiness.bankAccountName,
      paystackSubaccountCode: updatedBusiness.paystackSubaccountCode,
      paymentsEnabled: updatedBusiness.paymentsEnabled,
      currency: updatedBusiness.currency,
    },
  });
}
