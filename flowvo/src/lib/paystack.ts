import crypto from "crypto";

export interface InitializePaystackOptions {
  secretKey?: string;
  email: string;
  amountInKobo: number;
  currency: string;
  reference: string;
  callbackUrl?: string;
  metadata?: Record<string, unknown>;
  channels?: string[]; // e.g. ["card", "bank_transfer", "bank", "ussd", "qr", "mobile_money"]
  subaccount?: string; // e.g. "ACCT_xxxx" for direct split payout to tradesperson
  bearer?: "account" | "subaccount"; // Who bears Paystack transaction fee
}

export interface PaystackInitResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;
  data?: {
    id: number;
    status: string; // "success" | "failed" | "abandoned"
    reference: string;
    amount: number;
    currency: string;
    channel: string;
    paid_at: string;
    customer: {
      email: string;
    };
    metadata?: Record<string, unknown>;
  };
}

export interface PaystackBank {
  name: string;
  slug: string;
  code: string;
  longcode?: string;
  gateway?: string;
  pay_with_bank?: boolean;
  active?: boolean;
  is_deleted?: boolean;
  country?: string;
  currency?: string;
  type?: string;
}

export interface PaystackSubaccountResponse {
  status: boolean;
  message: string;
  data?: {
    subaccount_code: string;
    business_name: string;
    settlement_bank: string;
    account_number: string;
    percentage_charge: number;
  };
}

// Fallback top Nigerian banks for zero-downtime offline resolution
export const POPULAR_NIGERIAN_BANKS: { name: string; code: string }[] = [
  { name: "Access Bank", code: "044" },
  { name: "Guaranty Trust Bank (GTBank)", code: "058" },
  { name: "Zenith Bank", code: "057" },
  { name: "First Bank of Nigeria", code: "011" },
  { name: "United Bank for Africa (UBA)", code: "033" },
  { name: "Kuda Bank", code: "50211" },
  { name: "OPay (PayCom)", code: "999992" },
  { name: "Palmpay", code: "999991" },
  { name: "Moniepoint MFB", code: "50515" },
  { name: "Stanbic IBTC Bank", code: "221" },
  { name: "Sterling Bank", code: "232" },
  { name: "Fidelity Bank", code: "070" },
  { name: "First City Monument Bank (FCMB)", code: "214" },
  { name: "Union Bank of Nigeria", code: "032" },
  { name: "Wema Bank (ALAT)", code: "035" },
  { name: "Polaris Bank", code: "076" },
  { name: "Ecobank Nigeria", code: "050" },
  { name: "Keystone Bank", code: "082" },
  { name: "Jaiz Bank", code: "301" },
  { name: "Taj Bank", code: "302" },
  { name: "VFD Microfinance Bank", code: "566" },
  { name: "Rubies MFB", code: "125" },
];

/**
 * Returns the effective Paystack secret key: either custom provided or platform master from .env
 */
export function getEffectivePaystackSecretKey(customKey?: string | null): string | null {
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }
  return process.env.PAYSTACK_SECRET_KEY || null;
}

/**
 * Initialize a Paystack transaction and generate a payment link.
 * Supports split payments via subaccount (direct settlement to tradesperson's bank account).
 */
export async function initializePaystackTransaction(
  opts: InitializePaystackOptions
): Promise<PaystackInitResponse> {
  const secretKey = getEffectivePaystackSecretKey(opts.secretKey);
  if (!secretKey) {
    throw new Error("Paystack Secret Key is missing. Set PAYSTACK_SECRET_KEY in .env or configure in Settings.");
  }

  const { email, amountInKobo, currency, reference, callbackUrl, metadata, channels, subaccount, bearer } = opts;

  const body: Record<string, unknown> = {
    email,
    amount: amountInKobo,
    currency: currency.toUpperCase(),
    reference,
    channels: channels || ["card", "bank_transfer", "bank", "ussd", "qr", "mobile_money"],
  };

  if (callbackUrl) body.callback_url = callbackUrl;
  if (metadata) body.metadata = metadata;
  if (subaccount) {
    body.subaccount = subaccount;
    body.bearer = bearer || "subaccount"; // Tradesperson bears fee or platform bears fee
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return res.json();
}

/**
 * Verify a Paystack transaction by its reference.
 */
export async function verifyPaystackTransaction(
  reference: string,
  secretKey?: string | null
): Promise<PaystackVerifyResponse> {
  const key = getEffectivePaystackSecretKey(secretKey);
  if (!key) {
    throw new Error("Paystack Secret Key is missing");
  }

  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${key.trim()}`,
    },
  });

  return res.json();
}

/**
 * Resolve a 10-digit Nigerian NUBAN bank account number to get the verified account name.
 */
export async function resolvePaystackAccountNumber({
  accountNumber,
  bankCode,
  secretKey,
}: {
  accountNumber: string;
  bankCode: string;
  secretKey?: string | null;
}): Promise<{ status: boolean; message?: string; accountName?: string; accountNumber?: string }> {
  const key = getEffectivePaystackSecretKey(secretKey);
  if (!key) {
    return { status: false, message: "Paystack Secret Key is not configured." };
  }

  try {
    const res = await fetch(
      `https://api.paystack.co/bank/resolve?account_number=${encodeURIComponent(accountNumber.trim())}&bank_code=${encodeURIComponent(bankCode.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${key.trim()}`,
        },
      }
    );

    const data = await res.json();
    if (data.status && data.data?.account_name) {
      return {
        status: true,
        accountName: data.data.account_name,
        accountNumber: data.data.account_number,
      };
    }

    return {
      status: false,
      message: data.message || "Could not resolve account number. Please check account number and bank.",
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Network error connecting to Paystack";
    return { status: false, message: msg };
  }
}

/**
 * Create or update a Paystack Subaccount for a business.
 * Funds from customer invoice payments will settle directly to this bank account!
 */
export async function createPaystackSubaccount({
  businessName,
  settlementBank,
  accountNumber,
  percentageCharge = 0,
  secretKey,
}: {
  businessName: string;
  settlementBank: string; // Bank 3-digit code e.g. "058"
  accountNumber: string; // 10-digit NUBAN
  percentageCharge?: number; // Platform percentage fee (e.g. 0 for 0%, 1.0 for 1%)
  secretKey?: string | null;
}): Promise<PaystackSubaccountResponse> {
  const key = getEffectivePaystackSecretKey(secretKey);
  if (!key) {
    throw new Error("Paystack Secret Key is not configured on the server.");
  }

  const res = await fetch("https://api.paystack.co/subaccount", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      business_name: businessName,
      settlement_bank: settlementBank,
      account_number: accountNumber,
      percentage_charge: percentageCharge,
    }),
  });

  return res.json();
}

/**
 * List all commercial and microfinance banks supported in Nigeria.
 */
export async function listPaystackBanks(
  country = "nigeria",
  secretKey?: string | null
): Promise<{ status: boolean; banks: { name: string; code: string }[] }> {
  const key = getEffectivePaystackSecretKey(secretKey);

  if (key) {
    try {
      const res = await fetch(`https://api.paystack.co/bank?country=${encodeURIComponent(country)}&perPage=100`, {
        headers: {
          Authorization: `Bearer ${key.trim()}`,
        },
      });

      const data = await res.json();
      if (data.status && Array.isArray(data.data) && data.data.length > 0) {
        const seenCodes = new Set<string>();
        const uniqueBanks: { name: string; code: string }[] = [];
        for (const b of data.data) {
          const code = String(b.code || "").trim();
          if (code && !seenCodes.has(code)) {
            seenCodes.add(code);
            uniqueBanks.push({ name: String(b.name || "").trim(), code });
          }
        }
        return {
          status: true,
          banks: uniqueBanks,
        };
      }
    } catch {
      // Fallback below
    }
  }

  // Graceful fallback to curated popular banks
  return { status: true, banks: POPULAR_NIGERIAN_BANKS };
}

/**
 * Test if a Paystack Secret Key is valid by calling the Paystack API.
 */
export async function testPaystackKey(secretKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const res = await fetch("https://api.paystack.co/decision/bin/402321", {
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
      },
    });

    if (res.status === 401 || res.status === 403) {
      return { valid: false, error: "Invalid Paystack Secret Key" };
    }
    return { valid: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to connect to Paystack";
    return { valid: false, error: message };
  }
}

/**
 * Verify Paystack Webhook Signature (HMAC SHA512).
 */
export function verifyPaystackWebhookSignature(
  rawBody: string,
  signature: string | null,
  secretKey?: string | null
): boolean {
  const key = getEffectivePaystackSecretKey(secretKey);
  if (!signature || !key) return false;
  try {
    const hash = crypto.createHmac("sha512", key.trim()).update(rawBody).digest("hex");
    const hashBuf = Buffer.from(hash, "utf8");
    const sigBuf = Buffer.from(signature.trim(), "utf8");
    if (hashBuf.length !== sigBuf.length) {
      crypto.timingSafeEqual(hashBuf, hashBuf);
      return false;
    }
    return crypto.timingSafeEqual(hashBuf, sigBuf);
  } catch {
    return false;
  }
}
