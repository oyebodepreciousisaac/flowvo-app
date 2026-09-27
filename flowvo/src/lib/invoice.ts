import { prisma } from "@/lib/prisma";

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

export function formatPence(pence: number): string {
  return (pence / 100).toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
  });
}
