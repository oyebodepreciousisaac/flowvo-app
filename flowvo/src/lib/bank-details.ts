import { decryptField } from "@/lib/security";

export interface ParsedBankDetails {
  bankName: string | null;
  accountNumber: string | null;
  accountName: string | null;
  notes: string | null;
  hasDetails: boolean;
  formattedDisplay: string;
}

/**
 * Strips raw JSON formatting or internal keys (such as bankCode: "070")
 * so user-facing notes are always clean, human-readable sentences.
 */
export function cleanNotesText(rawNote: string | null | undefined): string | null {
  if (!rawNote) return null;
  let str = rawNote.trim();

  // If double-wrapped in quotes e.g. "{\"bankName\":...}"
  if (str.startsWith('"') && str.endsWith('"') && str.length > 2) {
    try {
      str = JSON.parse(str).trim();
    } catch {
      // keep str
    }
  }

  // Check if it contains JSON keys like "bankCode", "accountNumber", etc.
  if (
    str.includes('"bankCode"') ||
    str.includes('"accountNumber"') ||
    str.includes('"bankName"') ||
    (str.startsWith("{") && str.endsWith("}"))
  ) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === "object") {
        if (parsed.notes && typeof parsed.notes === "string") {
          const innerNote = parsed.notes.trim();
          return innerNote || null;
        }
        return null;
      }
    } catch {
      // If JSON.parse fails, regex extract notes field
      const match = str.match(/["']notes["']\s*:\s*["']([^"']*)["']/i);
      if (match && match[1]) {
        return match[1].trim() || null;
      }
      // If it looks like raw json, avoid dumping internal CBN code or keys
      if (str.startsWith("{") && str.endsWith("}")) {
        return null;
      }
    }
  }

  // Strip any accidental CBN bank code artifact if present
  str = str.replace(/bankCode\s*[:=]\s*["']?\d+["']?/gi, "").trim();

  return str || null;
}

/**
 * Parses and sanitizes bank settlement details for display across
 * invoices, quotes, printouts, and emails.
 *
 * Guarantees:
 * 1. Raw JSON strings are properly parsed into human-friendly fields.
 * 2. Internal CBN bank codes (e.g. "070", "058") are NEVER exposed to customers.
 * 3. Notes are cleanly separated from account numbers so they don't overlap containers.
 * 4. Fallback to legacy plain-text paymentDetails without throwing.
 */
export function parseBusinessBankDetails(business: {
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  paymentDetails?: string | null;
}): ParsedBankDetails {
  let bankName = business.bankName?.trim() || null;
  let accountNumber = business.bankAccountNumber?.trim() || null;
  let accountName = business.bankAccountName?.trim() || null;
  let notes: string | null = null;

  if (business.paymentDetails) {
    let raw = business.paymentDetails;
    try {
      const decrypted = decryptField(business.paymentDetails);
      if (decrypted) raw = decrypted;
    } catch {
      // keep raw
    }

    let trimmed = raw.trim();

    // Unwrap double stringified JSON if present
    if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length > 2) {
      try {
        trimmed = JSON.parse(trimmed).trim();
      } catch {
        // keep trimmed
      }
    }

    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed.bankName && typeof parsed.bankName === "string") {
          bankName = parsed.bankName.trim() || bankName;
        }
        if (parsed.accountNumber && typeof parsed.accountNumber === "string") {
          accountNumber = parsed.accountNumber.trim() || accountNumber;
        }
        if (parsed.accountName && typeof parsed.accountName === "string") {
          accountName = parsed.accountName.trim() || accountName;
        }
        if (parsed.notes && typeof parsed.notes === "string") {
          notes = cleanNotesText(parsed.notes);
        }
      } catch {
        notes = cleanNotesText(trimmed);
      }
    } else if (trimmed) {
      notes = cleanNotesText(trimmed);
    }
  }

  const parts: string[] = [];
  if (bankName) parts.push(`Bank: ${bankName}`);
  if (accountNumber) parts.push(`Account Number: ${accountNumber}`);
  if (accountName) parts.push(`Account Name: ${accountName}`);
  if (notes) parts.push(`Notes: ${notes}`);

  const hasDetails = Boolean(accountNumber || bankName || notes);

  return {
    bankName,
    accountNumber,
    accountName,
    notes,
    hasDetails,
    formattedDisplay: parts.join("\n"),
  };
}
