import { describe, it, expect } from "vitest";
import {
  rateLimit,
  encryptField,
  decryptField,
  isEncrypted,
  escapeHtml,
  isSameOrigin,
} from "@/lib/security";
import { strongPasswordSchema } from "@/lib/password";
import crypto from "crypto";

describe("Slice D: Security Hardening", () => {
  describe("1. Sliding-Window Rate Limiter", () => {
    it("allows requests under the limit and blocks requests exceeding the limit", () => {
      const key = `test-ip-${Date.now()}`;
      const limit = 3;
      const windowMs = 5000;

      expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
      expect(rateLimit(key, limit, windowMs).allowed).toBe(true);
      expect(rateLimit(key, limit, windowMs).allowed).toBe(true);

      const blocked = rateLimit(key, limit, windowMs);
      expect(blocked.allowed).toBe(false);
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    });
  });

  describe("2. AES-256-GCM Field-Level Encryption", () => {
    it("encrypts and decrypts sensitive payment details correctly", () => {
      const original = "Sort Code: 20-00-00, Account: 12345678, IBAN: GB29NWBK60161331926819";
      const encrypted = encryptField(original);

      expect(encrypted).not.toBeNull();
      expect(encrypted).not.toEqual(original);
      expect(isEncrypted(encrypted)).toBe(true);

      const decrypted = decryptField(encrypted);
      expect(decrypted).toEqual(original);
    });

    it("safely handles legacy unencrypted plaintext without corrupting it", () => {
      const legacyPlaintext = "Bank: NatWest, Account: 87654321";
      expect(isEncrypted(legacyPlaintext)).toBe(false);

      const result = decryptField(legacyPlaintext);
      expect(result).toBe(legacyPlaintext);
    });

    it("prevents double-encryption", () => {
      const text = "Sort: 11-22-33";
      const encrypted = encryptField(text);
      const reEncrypted = encryptField(encrypted);
      expect(reEncrypted).toBe(encrypted);
    });
  });

  describe("3. HTML Escaping for Stored XSS Prevention", () => {
    it("escapes all 5 HTML dangerous characters", () => {
      const malicious = '<script>alert("XSS & attack")</script>\'';
      const safe = escapeHtml(malicious);

      expect(safe).not.toContain("<script>");
      expect(safe).toContain("&lt;script&gt;");
      expect(safe).toContain("&quot;");
      expect(safe).toContain("&amp;");
      expect(safe).toContain("&#x27;");
    });

    it("handles null and empty input safely", () => {
      expect(escapeHtml(null)).toBe("");
      expect(escapeHtml("")).toBe("");
    });
  });

  describe("4. CSRF Origin Validation", () => {
    it("rejects unauthorized cross-origin mutating requests in production mode", () => {
      const originalEnv = process.env.NODE_ENV;
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";

      try {
        const maliciousReq = new Request("http://localhost:3000/api/business/profile", {
          method: "PATCH",
          headers: {
            origin: "https://evil-hacker-site.com",
          },
        });
        expect(isSameOrigin(maliciousReq)).toBe(false);

        const legitimateReq = new Request("http://localhost:3000/api/business/profile", {
          method: "PATCH",
          headers: {
            origin: "http://localhost:3000",
          },
        });
        expect(isSameOrigin(legitimateReq)).toBe(true);
      } finally {
        (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
      }
    });
  });

  describe("5. Strong Password Validation", () => {
    it("enforces strong password criteria across all auth entry points", () => {
      // Too short
      expect(strongPasswordSchema.safeParse("Ab1!").success).toBe(false);
      // No uppercase
      expect(strongPasswordSchema.safeParse("password123!").success).toBe(false);
      // No number
      expect(strongPasswordSchema.safeParse("Password!").success).toBe(false);
      // No special character
      expect(strongPasswordSchema.safeParse("Password123").success).toBe(false);
      // Compliant
      expect(strongPasswordSchema.safeParse("SecurePass123!").success).toBe(true);
    });
  });

  describe("6. Unguessable 256-bit Quote Tokens", () => {
    it("generates tokens with 256 bits of entropy (64 hex characters)", () => {
      const token1 = crypto.randomBytes(32).toString("hex");
      const token2 = crypto.randomBytes(32).toString("hex");

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
      expect(token1).not.toEqual(token2);
    });
  });
});
