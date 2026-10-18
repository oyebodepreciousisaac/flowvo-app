import crypto from "crypto";

export interface InitializeStripeCheckoutOptions {
  secretKey: string;
  customerEmail: string;
  amountInCents: number;
  currency: string;
  invoiceNumber: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}

export interface StripeSessionResponse {
  id?: string;
  url?: string;
  error?: {
    message: string;
  };
}

export function getEffectiveStripeSecretKey(customKey?: string | null): string {
  if (customKey && customKey.trim()) return customKey.trim();
  return process.env.STRIPE_SECRET_KEY || "";
}

export function getEffectiveStripePublishableKey(customKey?: string | null): string {
  if (customKey && customKey.trim()) return customKey.trim();
  return process.env.STRIPE_PUBLISHABLE_KEY || "";
}

/**
 * Initialize a Stripe Checkout Session for an invoice.
 * Supports Card, Apple Pay, Google Pay, SEPA, BACS, etc.
 */
export async function createStripeCheckoutSession(
  opts: InitializeStripeCheckoutOptions
): Promise<StripeSessionResponse> {
  const { secretKey, customerEmail, amountInCents, currency, invoiceNumber, successUrl, cancelUrl, metadata } = opts;

  const params = new URLSearchParams();
  params.append("mode", "payment");
  params.append("customer_email", customerEmail);
  params.append("success_url", successUrl);
  params.append("cancel_url", cancelUrl);

  // Line item
  params.append("line_items[0][price_data][currency]", currency.toLowerCase());
  params.append("line_items[0][price_data][unit_amount]", String(amountInCents));
  params.append("line_items[0][price_data][product_data][name]", `Invoice ${invoiceNumber}`);
  params.append("line_items[0][quantity]", "1");

  if (metadata) {
    for (const [key, val] of Object.entries(metadata)) {
      params.append(`metadata[${key}]`, String(val));
    }
  }

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey.trim()}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  return res.json();
}

/**
 * Test if a Stripe Secret Key is valid by calling the Stripe balance endpoint.
 */
export async function testStripeKey(secretKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "Invalid Stripe Secret Key" };
    }
    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to Stripe";
    return { valid: false, error: message };
  }
}

/**
 * Verify Stripe webhook signature (v1 HMAC-SHA256 timestamped).
 */
export function verifyStripeWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  webhookSecret: string
): boolean {
  if (!signatureHeader || !webhookSecret) return false;

  const parts = signatureHeader.split(",");
  const timestampPart = parts.find((p) => p.startsWith("t="));
  const sigPart = parts.find((p) => p.startsWith("v1="));

  if (!timestampPart || !sigPart) return false;

  const timestamp = timestampPart.slice(2);
  const signature = sigPart.slice(3);

  // Check timestamp drift (5 minutes maximum)
  const timeDiff = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (timeDiff > 300) return false;

  const signedPayload = `${timestamp}.${rawBody}`;
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret.trim())
    .update(signedPayload, "utf8")
    .digest("hex");

  try {
    const sigBuf = Buffer.from(signature, "hex");
    const expBuf = Buffer.from(expectedSignature, "hex");
    if (sigBuf.length !== expBuf.length) {
      crypto.timingSafeEqual(expBuf, expBuf);
      return false;
    }
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch {
    return false;
  }
}
