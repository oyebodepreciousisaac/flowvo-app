import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSameOrigin, decryptField } from "@/lib/security";
import { testPaystackKey } from "@/lib/paystack";
import { testStripeKey } from "@/lib/stripe";

const testSchema = z.object({
  gateway: z.enum(["PAYSTACK", "STRIPE"]),
  secretKey: z.string().min(5, "Secret key is required"),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = testSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid test request", details: parsed.error.format() }, { status: 400 });
    }

    const { gateway, secretKey } = parsed.data;

    let keyToTest = secretKey;
    if (keyToTest === "PRESERVED") {
      const business = await prisma.business.findUnique({
        where: { id: session.user.businessId },
      });
      if (gateway === "PAYSTACK") {
        keyToTest = decryptField(business?.paystackSecretKey) || process.env.PAYSTACK_SECRET_KEY || "";
      } else {
        keyToTest = decryptField(business?.stripeSecretKey) || process.env.STRIPE_SECRET_KEY || "";
      }
    }

    if (!keyToTest) {
      return NextResponse.json(
        { ok: false, valid: false, error: "No secret key found in settings or environment." },
        { status: 400 }
      );
    }

    if (gateway === "PAYSTACK") {
      const result = await testPaystackKey(keyToTest);
      return NextResponse.json({ ok: result.valid, valid: result.valid, error: result.error });
    } else {
      const result = await testStripeKey(keyToTest);
      return NextResponse.json({ ok: result.valid, valid: result.valid, error: result.error });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Connection test failed";
    return NextResponse.json({ ok: false, valid: false, error: message }, { status: 500 });
  }
}
