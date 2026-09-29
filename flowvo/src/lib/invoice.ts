import { prisma } from "@/lib/prisma";
import { formatAmount, getCurrencySymbol } from "./currency";

export { formatAmount, getCurrencySymbol };

/**
 * Generates the next sequential invoice number for a business (e.g. INV-001, INV-002)
 */
export async function getNextInvoiceNumber(businessId: string): Promise<string> {
  const count = await prisma.invoice.count({
    where: { businessId },
  });
  const nextNum = count + 1;
  return `INV-${String(nextNum).padStart(3, "0")}`;
}

/**
 * Formats an amount in pence/smallest currency unit.
 * Kept for backward compatibility; accepts optional currency parameter.
 */
export function formatPence(pence: number, currency: string = "GBP"): string {
  return formatAmount(pence, currency);
}
