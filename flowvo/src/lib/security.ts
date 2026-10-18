/**
 * Security utilities:
 * - In-memory sliding-window rate limiter (no external service required)
 * - CSRF origin validation
 * - AES-256-GCM field-level encryption for sensitive data (paymentDetails, etc.)
 * - HTML sanitisation for user-supplied text going into email templates
 *
 * Design principles:
 *  • Zero external dependencies — uses only Node.js built-ins
 *  • The in-memory rate limiter works perfectly for a single-process server
 *    (Vercel Serverless / single Node instance). For multi-region deploys,
 *    swap the Map for @upstash/redis without changing call sites.
 */

import crypto from "crypto";

// ─── 1. In-Memory Rate Limiter ────────────────────────────────────────────────
//
// Sliding-window algorithm: keeps timestamps of requests within the window.
// Thread-safe enough for single-process serverless (each invocation has its
// own process; in-memory is acceptable for auth rate limiting as a first
// defence layer; the session db provides a second layer).

type WindowEntry = { timestamps: number[] };
const _store = new Map<string, WindowEntry>();

/**
 * Check whether a key (e.g., "login:1.2.3.4") has exceeded its limit.
 * Returns { allowed: boolean; retryAfterMs: number }
 *
 * @param key         Unique key — typically `"route:ip"`
 * @param limit       Max requests allowed in the window
 * @param windowMs    Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  const entry = _store.get(key) ?? { timestamps: [] };

  // Prune timestamps outside the current window
  entry.timestamps = entry.timestamps.filter((ts) => now - ts < windowMs);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfterMs = windowMs - (now - oldest);
    _store.set(key, entry);
    return { allowed: false, retryAfterMs };
  }

  entry.timestamps.push(now);
  _store.set(key, entry);
  return { allowed: true, retryAfterMs: 0 };
}

/**
 * Extract the real client IP from a Next.js Request.
 * Respects x-forwarded-for set by Vercel / Cloudflare.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

// ─── 2. CSRF Origin Validation ───────────────────────────────────────────────
//
// For same-site cookie auth, verifying the Origin/Referer header is the
// lightweight CSRF mitigation that requires no tokens.
// sameSite: "lax" blocks cross-site POSTs from forms but NOT from
// cross-site fetch() with credentials — so Origin check is still needed.

const ALLOWED_ORIGINS = new Set([
  process.env.NEXTAUTH_URL ?? "http://localhost:3000",
  "http://localhost:3000",
  "https://localhost:3000",
]);

/**
 * Returns true when the request Origin (or Referer) matches the app domain.
 * Dynamically compares against the current request host/x-forwarded-host,
 * NEXTAUTH_URL, and VERCEL_URL.
 */
export function isSameOrigin(request: Request): boolean {
  if (process.env.NODE_ENV !== "production") return true;

  const origin = request.headers.get("origin") ?? "";
  const referer = request.headers.get("referer") ?? "";

  const check = origin || referer;
  if (!check) return false;

  try {
    const checkUrl = new URL(check);
    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");

    // Dynamic same-origin match against the serving host
    if (host && (checkUrl.host === host || host.startsWith(checkUrl.host))) {
      return true;
    }

    // Match against NEXTAUTH_URL if set
    if (process.env.NEXTAUTH_URL) {
      const authUrl = new URL(process.env.NEXTAUTH_URL);
      if (checkUrl.host === authUrl.host) return true;
    }

    // Match against VERCEL_URL if set
    if (process.env.VERCEL_URL) {
      if (checkUrl.host === process.env.VERCEL_URL) return true;
    }
  } catch {
    // Malformed origin/referer URL
    return false;
  }

  for (const allowed of ALLOWED_ORIGINS) {
    if (check.startsWith(allowed)) return true;
  }
  return false;
}

// ─── 3. AES-256-GCM Field-Level Encryption ───────────────────────────────────
//
// Used for sensitive fields: paymentDetails, bank account numbers, etc.
// Key is loaded from FIELD_ENCRYPTION_KEY env var (must be 32 bytes hex = 64 chars).
// Format: "iv_hex:authTag_hex:ciphertext_hex"  (all values hex-encoded)

const DEV_FALLBACK_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function getEncryptionKey(): Buffer {
  if (process.env.NODE_ENV === "production" && !process.env.FIELD_ENCRYPTION_KEY) {
    throw new Error(
      "FATAL SECURITY CONFIGURATION: FIELD_ENCRYPTION_KEY must be set in production environment. " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const keyHex = process.env.FIELD_ENCRYPTION_KEY || (process.env.NODE_ENV !== "production" ? DEV_FALLBACK_KEY : "");
  if (!keyHex || keyHex.length !== 64) {
    throw new Error(
      "FIELD_ENCRYPTION_KEY env var must be a 64-character hex string (32 bytes). " +
        "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(keyHex, "hex");
}

/**
 * Encrypt a plaintext string.
 * Returns a string in the format "iv:authTag:ciphertext" (all hex).
 * Returns null if the input is null or undefined.
 */
export function encryptField(plaintext: string | null | undefined): string | null {
  if (plaintext == null) return null;
  if (isEncrypted(plaintext)) return plaintext; // Prevent double-encryption
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a string encrypted by encryptField().
 * If the value is not encrypted (e.g. legacy data), returns plaintext as-is.
 * Returns null on decryption failure or null input.
 */
export function decryptField(ciphertext: string | null | undefined): string | null {
  if (ciphertext == null) return null;
  // If not encrypted format, safely return the plaintext string (backwards compatibility)
  if (!isEncrypted(ciphertext)) return ciphertext;

  try {
    const [ivHex, authTagHex, dataHex] = ciphertext.split(":");
    if (!ivHex || !authTagHex || !dataHex) return ciphertext;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const data = Buffer.from(dataHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(data).toString("utf8") + decipher.final("utf8");
  } catch {
    return null; // Tampered or corrupted — fail safely
  }
}

/**
 * Returns true if the value looks like an encrypted field (contains two colons
 * in the iv:authTag:ciphertext format). Useful to avoid double-encrypting.
 */
export function isEncrypted(value: string | null | undefined): boolean {
  if (!value) return false;
  const parts = value.split(":");
  return parts.length === 3 && parts.every((p) => /^[0-9a-f]+$/i.test(p));
}

// ─── 4. HTML Sanitisation ─────────────────────────────────────────────────────
//
// Escapes the 5 HTML special characters to prevent stored XSS when
// user-supplied strings are embedded in email HTML templates.
// This is the correct approach — NOT filtering (which can be bypassed);
// escaping is lossless and safe for all inputs.

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
};

/**
 * Escape user-supplied text before embedding it in HTML email templates.
 * Always call this on: customer names, service descriptions, addresses,
 * notes, or any other field that came from user input.
 */
export function escapeHtml(str: string | null | undefined): string {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (char) => HTML_ESCAPE_MAP[char] ?? char);
}

// ─── 5. Timing-Safe Comparison ────────────────────────────────────────────────
//
// Prevents side-channel timing attacks when comparing secrets, tokens,
// and HMAC hashes. Always executes in constant time.
//
export function timingSafeCompare(
  a: string | null | undefined,
  b: string | null | undefined
): boolean {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    // Perform dummy constant-time comparison to prevent length timing leakage
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}
