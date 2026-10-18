import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { StatusChip } from "@/components/ui/StatusChip";
import { LineItem } from "@/lib/email-templates/quote-email";
import { formatAmount } from "@/lib/currency";
import { getNextInvoiceNumber } from "@/lib/invoice";
import { generateInvoicePaymentLink, processInvoicePaymentSuccess } from "@/lib/invoice-payment";
import { parseBusinessBankDetails } from "@/lib/bank-details";
import { QuoteAcceptanceCard, PaymentInfo } from "./QuoteAcceptanceCard";
import { FileText, Phone, Mail, Calendar, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ quoteToken: string }>;
  searchParams?: Promise<{ paid?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { quoteToken } = await params;
  const quote = await prisma.quote.findUnique({
    where: { quoteToken },
    include: { business: true },
  });

  if (!quote) return { title: "Quote — Settlevo" };

  const currency = (quote.currency || quote.business.currency || "NGN").toUpperCase();
  const formattedTotal = formatAmount(quote.total, currency);
  const title = `Quote from ${quote.business.name} — ${formattedTotal}`;
  const description = `${quote.business.name} has sent you a quote for ${formattedTotal}. Tap to review the full itemized breakdown and accept or decline.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Settlevo",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function PublicQuotePage({ params, searchParams }: PageProps) {
  const { quoteToken } = await params;
  const search = searchParams ? await searchParams : {};
  const isPaidReturn = search.paid === "true";
  const origin = process.env.NEXTAUTH_URL || "http://localhost:3000";

  let quote = await prisma.quote.findUnique({
    where: { quoteToken },
    include: {
      lead: true,
      business: true,
      jobs: true,
      invoices: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      activityLogs: {
        where: { eventType: "payment.receipt_submitted" },
        orderBy: { occurredAt: "desc" },
        take: 1,
      },
    },
  });

  if (!quote) {
    notFound();
  }

  const currency = (quote.currency || quote.business.currency || "NGN").toUpperCase();
  const formattedTotal = formatAmount(quote.total, currency);

  let invoice = quote.invoices[0];

  // If returning from online payment gateway, mark invoice paid idempotently
  if (isPaidReturn && invoice && invoice.status !== "PAID") {
    try {
      await processInvoicePaymentSuccess({
        invoiceId: invoice.id,
        origin,
      });
      // Refresh invoice record
      const refreshedInvoice = await prisma.invoice.findUnique({
        where: { id: invoice.id },
      });
      if (refreshedInvoice) {
        invoice = refreshedInvoice;
      }
    } catch (err) {
      console.error("Error processing payment return:", err);
    }
  }

  // If quote is already accepted but has no invoice, auto-create it
  if (quote.status === "ACCEPTED" && !invoice) {
    try {
      const invoiceNumber = await getNextInvoiceNumber(quote.businessId);
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      invoice = await prisma.invoice.create({
        data: {
          quoteId: quote.id,
          jobId: quote.jobs[0]?.id || null,
          leadId: quote.leadId,
          businessId: quote.businessId,
          customerName: quote.lead.customerName,
          customerEmail: quote.lead.email,
          invoiceNumber,
          lineItems: quote.lineItems,
          subtotal: quote.total,
          total: quote.total,
          currency,
          status: "SENT",
          dueDate,
        },
      });
    } catch (err) {
      console.error("Error creating invoice for accepted quote:", err);
    }
  }

  // Ensure paymentLinkUrl exists if accepted
  if (quote.status === "ACCEPTED" && invoice && !invoice.paymentLinkUrl) {
    try {
      const linkRes = await generateInvoicePaymentLink({
        invoice,
        business: quote.business,
        origin,
        callbackPath: `/q/${quote.quoteToken}?paid=true`,
      });
      if (linkRes.paymentLinkUrl) {
        invoice.paymentLinkUrl = linkRes.paymentLinkUrl;
        invoice.paymentReference = linkRes.paymentReference;
      }
    } catch (err) {
      console.error("Error generating payment link for quote:", err);
    }
  }

  // Parse bank details reliably
  const bankDetails = parseBusinessBankDetails(quote.business);
  const effectiveBankName = bankDetails.bankName || "Official Settlement Bank";
  const effectiveAccountNumber = bankDetails.accountNumber || "";
  const effectiveAccountName = bankDetails.accountName || quote.business.name;
  const effectiveNotes = bankDetails.notes || "";

  // Parse submitted receipt proof if any
  const receiptLog = quote.activityLogs[0];
  let receiptDetails = null;
  if (receiptLog?.detail && receiptLog.detail.startsWith("{")) {
    try {
      receiptDetails = JSON.parse(receiptLog.detail);
    } catch {
      // ignore
    }
  }

  const initialPaymentInfo: PaymentInfo = {
    invoiceId: invoice?.id || null,
    invoiceNumber: invoice?.invoiceNumber || null,
    invoiceStatus: invoice?.status || "SENT",
    paidAtFormatted: invoice?.paidAt
      ? new Date(invoice.paidAt).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null,
    paymentLinkUrl: invoice?.paymentLinkUrl || null,
    paymentReference: invoice?.paymentReference || null,
    bankName: effectiveBankName,
    bankAccountNumber: effectiveAccountNumber,
    bankAccountName: effectiveAccountName,
    paymentNotes: effectiveNotes,
    businessPhone: quote.business.notificationPhone || quote.business.phone || null,
    receiptSubmitted: Boolean(receiptLog),
    receiptDetails,
  };

  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(quote.lineItems);
  } catch {
    lineItems = [];
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[640px] w-full mx-auto space-y-6">
        {/* Business Header Card */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
            <div>
              {quote.business.logoUrl ? (
                <div className="mb-2">
                  <img
                    src={quote.business.logoUrl}
                    alt={quote.business.name}
                    className="h-10 sm:h-12 w-auto max-w-[180px] object-contain"
                  />
                </div>
              ) : (
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[var(--color-primary-subtle)] text-[var(--color-primary)] font-bold text-base mb-2">
                  {quote.business.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              <h1 className="text-xl font-bold tracking-tight text-[var(--color-text)]">
                {quote.business.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[var(--color-text-secondary)]">
                <a
                  href={`mailto:${quote.business.email}`}
                  className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>{quote.business.email}</span>
                </a>
                {quote.business.phone && (
                  <a
                    href={`tel:${quote.business.phone}`}
                    className="inline-flex items-center gap-1 hover:text-[var(--color-primary)]"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{quote.business.phone}</span>
                  </a>
                )}
                {(quote.business.notificationPhone || quote.business.phone) && (
                  <a
                    href={`https://wa.me/${(quote.business.notificationPhone || quote.business.phone || "").replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <span>Chat on WhatsApp</span>
                  </a>
                )}
              </div>
            </div>

            <div className="sm:text-right">
              <span className="block text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)] mb-1">
                Status
              </span>
              <StatusChip status={quote.status} />
            </div>
          </div>

          {/* Quote Meta */}
          <div className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="block text-[var(--color-text-muted)] mb-0.5">Prepared For:</span>
              <span className="font-semibold text-sm text-[var(--color-text)] block">
                {quote.lead.customerName}
              </span>
              <span className="text-[var(--color-text-secondary)] block">
                {quote.lead.email}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="block text-[var(--color-text-muted)] mb-0.5">Quote Date:</span>
              <span className="font-medium text-[var(--color-text)] block">
                {new Date(quote.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              <span className="text-[var(--color-text-muted)] block">
                Work: {quote.lead.serviceType}
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="mt-4 border-t border-[var(--color-border)] pt-4">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-[var(--color-text-muted)] mb-3">
              Itemized Quote
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[var(--color-border)] text-[var(--color-text-secondary)]">
                    <th className="py-2.5 pr-2 font-semibold">Description</th>
                    <th className="py-2.5 px-2 font-semibold text-center w-16">Qty</th>
                    <th className="py-2.5 px-2 font-semibold text-right w-24">Rate</th>
                    <th className="py-2.5 pl-2 font-semibold text-right w-24">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {lineItems.map((item, index) => (
                    <tr key={item.id || index} className="text-[var(--color-text)]">
                      <td className="py-3 pr-2 font-medium">{item.description}</td>
                      <td className="py-3 px-2 text-center text-[var(--color-text-secondary)]">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-[var(--color-text-secondary)]">
                        {formatAmount(item.unitPricePence, currency)}
                      </td>
                      <td className="py-3 pl-2 text-right font-mono font-semibold text-[var(--color-text)]">
                        {formatAmount(item.lineTotalPence, currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-[var(--color-border-strong)]">
                    <td colSpan={3} className="pt-4 pb-2 text-right text-sm font-bold text-[var(--color-text)]">
                      Total:
                    </td>
                    <td className="pt-4 pb-2 text-right text-lg font-bold font-mono text-[var(--color-primary)]">
                      {formattedTotal}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Acceptance Action Component */}
          <div className="mt-6">
            <QuoteAcceptanceCard
              quoteToken={quote.quoteToken}
              initialStatus={quote.status}
              businessName={quote.business.name}
              totalFormatted={formattedTotal}
              currency={currency}
              acceptedAt={quote.acceptedAt?.toISOString()}
              declinedAt={quote.declinedAt?.toISOString()}
              initialPaymentInfo={initialPaymentInfo}
            />
          </div>
        </div>

        {/* Trust & Guarantee note */}
        <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-muted)] text-center">
          <ShieldCheck className="w-4 h-4 text-[var(--color-primary)]" />
          <span>Secure quote provided through Settlevo operations system.</span>
        </div>
      </div>
    </div>
  );
}
