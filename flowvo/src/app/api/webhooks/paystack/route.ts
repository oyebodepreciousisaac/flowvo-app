import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { decryptField } from "@/lib/security";
import { processInvoicePaymentSuccess } from "@/lib/invoice-payment";

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const signature = request.headers.get("x-paystack-signature");
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ─── 1. Mandatory Webhook Signature Validation ─────────────────────────────
  if (!signature) {
    return NextResponse.json({ error: "Missing x-paystack-signature header" }, { status: 401 });
  }

  const masterSecretKey = process.env.PAYSTACK_SECRET_KEY || "";
  const event = payload?.event;
  const data = payload?.data;

  // We are interested in charge.success; acknowledge other events securely
  if (event !== "charge.success" || !data) {
    if (masterSecretKey) {
      const isValid = verifyPaystackWebhookSignature(rawBody, signature, masterSecretKey);
      if (!isValid) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }
    return NextResponse.json({ ok: true, message: "Ignored event" });
  }

  const reference = data.reference;
  const invoiceId = data.metadata?.invoiceId;

  // Find invoice by reference or metadata invoiceId
  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        { paymentReference: reference },
        ...(invoiceId ? [{ id: invoiceId }] : []),
      ],
    },
    include: {
      business: true,
    },
  });

  // Verify signature: try custom business key first, then fallback to master key
  const customSecretKey = invoice ? decryptField(invoice.business.paystackSecretKey) : null;
  const effectiveSecretKey = customSecretKey || masterSecretKey;

  if (!effectiveSecretKey) {
    return NextResponse.json(
      { error: "Paystack webhook secret key is not configured" },
      { status: 401 }
    );
  }

  const isValid = verifyPaystackWebhookSignature(rawBody, signature, effectiveSecretKey);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (!invoice) {
    // Acknowledge receipt to satisfy Paystack webhook test pings
    return NextResponse.json({ ok: true, message: "Invoice not found for reference" });
  }

  // Process payment success idempotently
  const origin = request.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
  await processInvoicePaymentSuccess({
    invoiceId: invoice.id,
    gatewayPaymentId: String(data.id),
    paymentReference: reference,
    origin,
  });

  return NextResponse.json({ ok: true, received: true });
}
