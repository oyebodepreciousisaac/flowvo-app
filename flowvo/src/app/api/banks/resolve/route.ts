import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { resolvePaystackAccountNumber } from "@/lib/paystack";
import { isSameOrigin } from "@/lib/security";

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

  const { accountNumber, bankCode } = (body as { accountNumber?: string; bankCode?: string }) || {};

  if (!accountNumber || accountNumber.trim().length !== 10) {
    return NextResponse.json(
      { error: "Account number must be a 10-digit NUBAN." },
      { status: 422 }
    );
  }

  if (!bankCode || bankCode.trim().length === 0) {
    return NextResponse.json({ error: "Bank code is required." }, { status: 422 });
  }

  const res = await resolvePaystackAccountNumber({
    accountNumber: accountNumber.trim(),
    bankCode: bankCode.trim(),
  });

  if (!res.status || !res.accountName) {
    return NextResponse.json(
      { error: res.message || "Could not verify bank account with Paystack." },
      { status: 422 }
    );
  }

  return NextResponse.json({
    ok: true,
    accountName: res.accountName,
    accountNumber: res.accountNumber,
  });
}
