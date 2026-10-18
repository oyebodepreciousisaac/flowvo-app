import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { timingSafeCompare, encryptField } from "@/lib/security";
import { verifyPaystackWebhookSignature } from "@/lib/paystack";
import { verifyStripeWebhookSignature } from "@/lib/stripe";

describe("Security Audit & Remediation Verification", () => {
  describe("1. Timing-Safe String Comparison (CWE-208)", () => {
    it("returns true for identical strings", () => {
      const secret = "my-super-secret-cron-token-12345";
      expect(timingSafeCompare(secret, secret)).toBe(true);
    });

    it("returns false for different strings of same length", () => {
      const a = "my-super-secret-cron-token-12345";
      const b = "my-super-secret-cron-token-99999";
      expect(timingSafeCompare(a, b)).toBe(false);
    });

    it("returns false for strings of different lengths without throwing", () => {
      const a = "short-secret";
      const b = "much-longer-secret-token-value";
      expect(timingSafeCompare(a, b)).toBe(false);
    });

    it("returns false safely for null and undefined inputs", () => {
      expect(timingSafeCompare(null, "secret")).toBe(false);
      expect(timingSafeCompare("secret", null)).toBe(false);
      expect(timingSafeCompare(undefined, undefined)).toBe(false);
    });
  });

  describe("2. Cryptographic Key Protection in Production (CWE-321)", () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...originalEnv };
    });

    it("throws a fatal error in production if FIELD_ENCRYPTION_KEY is unset", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.FIELD_ENCRYPTION_KEY;

      expect(() => {
        encryptField("sensitive bank data");
      }).toThrow(/FIELD_ENCRYPTION_KEY must be set in production/);
    });

    it("succeeds in production when a valid 64-character hex key is provided", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.FIELD_ENCRYPTION_KEY = crypto.randomBytes(32).toString("hex");

      const encrypted = encryptField("Sort Code: 04-00-04, Account: 12345678");
      expect(encrypted).not.toBeNull();
      expect(typeof encrypted).toBe("string");
    });
  });

  describe("3. Paystack Webhook Signature Verification (CWE-347)", () => {
    const testSecret = "sk_test_1234567890abcdef";
    const testPayload = JSON.stringify({
      event: "charge.success",
      data: { reference: "INV-PAY-001", amount: 50000 },
    });

    it("accepts valid HMAC-SHA512 signature", () => {
      const validSig = crypto
        .createHmac("sha512", testSecret)
        .update(testPayload)
        .digest("hex");

      expect(verifyPaystackWebhookSignature(testPayload, validSig, testSecret)).toBe(true);
    });

    it("rejects tampered payload with mismatched signature", () => {
      const validSig = crypto
        .createHmac("sha512", testSecret)
        .update(testPayload)
        .digest("hex");

      const tamperedPayload = JSON.stringify({
        event: "charge.success",
        data: { reference: "INV-PAY-001", amount: 100 }, // changed amount
      });

      expect(verifyPaystackWebhookSignature(tamperedPayload, validSig, testSecret)).toBe(false);
    });

    it("rejects null or empty signature headers", () => {
      expect(verifyPaystackWebhookSignature(testPayload, null, testSecret)).toBe(false);
      expect(verifyPaystackWebhookSignature(testPayload, "", testSecret)).toBe(false);
    });
  });

  describe("4. Stripe Webhook Signature Verification & Buffer Hardening (CWE-347 & CWE-20)", () => {
    const testSecret = "whsec_test_secret_abc123";
    const testBody = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });

    it("accepts valid timestamped v1 signature within time tolerance", () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${testBody}`;
      const validSig = crypto
        .createHmac("sha256", testSecret)
        .update(signedPayload, "utf8")
        .digest("hex");

      const header = `t=${timestamp},v1=${validSig}`;
      expect(verifyStripeWebhookSignature(testBody, header, testSecret)).toBe(true);
    });

    it("rejects signatures with expired timestamp (> 300s drift)", () => {
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400s ago
      const signedPayload = `${oldTimestamp}.${testBody}`;
      const validSig = crypto
        .createHmac("sha256", testSecret)
        .update(signedPayload, "utf8")
        .digest("hex");

      const header = `t=${oldTimestamp},v1=${validSig}`;
      expect(verifyStripeWebhookSignature(testBody, header, testSecret)).toBe(false);
    });

    it("handles malformed or odd-length hex signatures without throwing uncaught exceptions", () => {
      const timestamp = Math.floor(Date.now() / 1000);
      const malformedHeader = `t=${timestamp},v1=invalid_non_hex_odd_length_123`;

      expect(() => {
        const result = verifyStripeWebhookSignature(testBody, malformedHeader, testSecret);
        expect(result).toBe(false);
      }).not.toThrow();
    });

    it("rejects missing signature or missing webhook secret", () => {
      expect(verifyStripeWebhookSignature(testBody, null, testSecret)).toBe(false);
      expect(verifyStripeWebhookSignature(testBody, "t=123,v1=abc", "")).toBe(false);
    });
  });
});
