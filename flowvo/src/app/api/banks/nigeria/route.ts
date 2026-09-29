import { NextResponse } from "next/server";
import { listPaystackBanks } from "@/lib/paystack";

export async function GET() {
  const result = await listPaystackBanks("nigeria");
  return NextResponse.json({ ok: true, banks: result.banks });
}
