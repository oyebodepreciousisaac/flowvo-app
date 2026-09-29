import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyStripeWebhookSignature } from "@/lib/stripe";
import { processInvoicePaymentSuccess } from "@/lib/invoice-payment";

export async function POST(request: NextRequest) {
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = payload?.type;
  const dataObject = payload?.data?.object;

  if (eventType !== "checkout.session.completed" && eventType !== "payment_intent.succeeded") {
    return NextResponse.json({ ok: true, message: "Ignored event" });
  }

  const invoiceId = dataObject?.metadata?.invoiceId || dataObject?.client_reference_id;
  const paymentReference = dataObject?.id;

  if (!invoiceId && !paymentReference) {
    return NextResponse.json({ error: "No invoice reference in payload" }, { status: 400 });
  }

  const invoice = await prisma.invoice.findFirst({
    where: {
      OR: [
        ...(invoiceId ? [{ id: invoiceId }] : []),
        { paymentReference },
      ],
    },
    include: {
      business: true,
    },
  });

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  if (webhookSecret && signature) {
    const isValid = verifyStripeWebhookSignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid webhook signature" }, { status: 401 });
    }
  }

  if (!invoice) {
    return NextResponse.json({ ok: true, message: "Invoice not found for reference" });
  }

  const origin = request.nextUrl.origin || "http://localhost:3000";
  await processInvoicePaymentSuccess({
    invoiceId: invoice.id,
    gatewayPaymentId: dataObject?.id,
    paymentReference: paymentReference || undefined,
    origin,
  });

  return NextResponse.json({ ok: true, received: true });
}
