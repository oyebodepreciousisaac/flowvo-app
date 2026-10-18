import React from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptField } from "@/lib/security";
import { formatAmount } from "@/lib/currency";
import { parseBusinessBankDetails } from "@/lib/bank-details";
import { LineItem } from "@/lib/email-templates/quote-email";
import { PrintControls } from "./PrintControls";
import { CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    select: { invoiceNumber: true, customerName: true },
  });

  return {
    title: invoice
      ? `Invoice ${invoice.invoiceNumber} — ${invoice.customerName}`
      : "Printable Invoice",
  };
}

export default async function PrintableInvoicePage({ params }: PageProps) {
  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      business: true,
      lead: true,
      job: true,
    },
  });

  if (!invoice) {
    notFound();
  }

  let lineItems: LineItem[] = [];
  try {
    lineItems = JSON.parse(invoice.lineItems);
  } catch {
    lineItems = [];
  }

  const currency = (invoice.currency || invoice.business.currency || "NGN").toUpperCase();

  const createdDate = new Date(invoice.createdAt);
  const formattedIssueDate = createdDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedIssueTime = createdDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dueDate = new Date(invoice.dueDate);
  const formattedDueDate = dueDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const paidDate = invoice.paidAt ? new Date(invoice.paidAt) : null;
  const formattedPaidDateTime = paidDate
    ? `${paidDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })} at ${paidDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
    : null;

  const totalFormatted = formatAmount(invoice.total, currency);
  const subtotalFormatted = formatAmount(invoice.subtotal, currency);
  const bankDetails = parseBusinessBankDetails(invoice.business);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-[#111827] print:bg-white print:text-black">
      {/* Interactive print control bar (hidden in print) */}
      <PrintControls invoiceId={invoice.id} invoiceNumber={invoice.invoiceNumber} />

      {/* Main A4 Document Container */}
      <div className="max-w-4xl mx-auto my-6 p-4 sm:p-8 md:p-12 bg-white rounded-xl shadow-lg border border-gray-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:rounded-none">
        
        {/* Document Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start pb-8 border-b-2 border-gray-900 gap-6">
          {/* Business Info */}
          <div>
            {invoice.business.logoUrl && (
              <div className="mb-3">
                <img
                  src={invoice.business.logoUrl}
                  alt={invoice.business.name}
                  className="h-12 w-auto max-w-[180px] object-contain"
                />
              </div>
            )}
            <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded mb-3 tracking-wider uppercase">
              Official Tax Invoice
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-950">
              {invoice.business.name}
            </h1>
            <div className="mt-2 text-xs sm:text-sm text-gray-600 space-y-0.5 leading-relaxed">
              {invoice.business.address && (
                <p className="whitespace-pre-line font-medium text-gray-700">
                  {invoice.business.address}
                </p>
              )}
              <p>Email: <span className="text-gray-900 font-medium">{invoice.business.email}</span></p>
              {invoice.business.phone && (
                <p>Phone: <span className="text-gray-900 font-medium">{invoice.business.phone}</span></p>
              )}
              <p>Country: <span className="text-gray-900 font-medium">{invoice.business.country || "Nigeria"}</span></p>
            </div>
          </div>

          {/* Invoice Meta Box */}
          <div className="sm:text-right flex flex-col sm:items-end w-full sm:w-auto">
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="text-xs uppercase font-semibold text-gray-500 tracking-wider">
                Status:
              </span>
              {invoice.status === "PAID" ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  PAID IN FULL
                </span>
              ) : invoice.status === "OVERDUE" ? (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertCircle className="w-3.5 h-3.5" />
                  OVERDUE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Clock className="w-3.5 h-3.5" />
                  PAYMENT DUE
                </span>
              )}
            </div>

            <div className="text-3xl font-black font-mono tracking-tight text-gray-900">
              {invoice.invoiceNumber}
            </div>

            <div className="mt-3 text-xs sm:text-sm text-gray-600 space-y-1">
              <p>
                <span className="text-gray-500">Issued On: </span>
                <strong className="text-gray-900">{formattedIssueDate}</strong>
              </p>
              <p>
                <span className="text-gray-500">Issue Time: </span>
                <strong className="text-gray-900 font-mono">{formattedIssueTime}</strong>
              </p>
              <p>
                <span className="text-gray-500">Payment Due: </span>
                <strong className="text-gray-900">{formattedDueDate}</strong>
              </p>
              {formattedPaidDateTime && (
                <p className="text-emerald-700 font-semibold">
                  <span>Paid At: </span>
                  <span>{formattedPaidDateTime}</span>
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Customer & Billing Details */}
        <section className="py-6 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs sm:text-sm">
          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Billed To
            </h2>
            <div className="text-gray-900 font-bold text-base">
              {invoice.customerName}
            </div>
            <div className="text-gray-600 mt-1 space-y-0.5">
              <p>Email: <span className="font-medium text-gray-900">{invoice.customerEmail}</span></p>
              {invoice.lead?.phone && (
                <p>Phone: <span className="font-medium text-gray-900">{invoice.lead.phone}</span></p>
              )}
              {invoice.lead?.serviceType && (
                <p>Service: <span className="font-medium text-gray-900">{invoice.lead.serviceType}</span></p>
              )}
            </div>
          </div>

          <div className="sm:text-right">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
              Payment Summary
            </h2>
            <div className="text-gray-600 space-y-1">
              <p>
                <span className="text-gray-500">Currency: </span>
                <strong className="text-gray-900">{currency}</strong>
              </p>
              <p>
                <span className="text-gray-500">Terms: </span>
                <strong className="text-gray-900">Net 30 Days</strong>
              </p>
              {invoice.paymentReference && (
                <p>
                  <span className="text-gray-500">Reference: </span>
                  <strong className="font-mono text-gray-900">{invoice.paymentReference}</strong>
                </p>
              )}
            </div>
          </div>
        </section>

        {/* Itemized Line Items Table */}
        <section className="py-6">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b-2 border-gray-900 bg-gray-50 text-[11px] font-extrabold uppercase tracking-wider text-gray-700">
                  <th className="py-3 px-3 w-12 text-center">#</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3 text-center w-20">Qty</th>
                  <th className="py-3 px-3 text-right w-32">Unit Price</th>
                  <th className="py-3 px-3 text-right w-36">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {lineItems.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-gray-50/50">
                    <td className="py-3.5 px-3 text-center text-gray-400 font-mono">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-3 font-semibold text-gray-900">
                      {item.description}
                    </td>
                    <td className="py-3.5 px-3 text-center text-gray-600 font-medium">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-gray-600">
                      {formatAmount(item.unitPricePence, currency)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">
                      {formatAmount(item.lineTotalPence, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Subtotals & Grand Total */}
          <div className="mt-4 pt-4 border-t-2 border-gray-900 flex justify-end">
            <div className="w-full sm:w-80 space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between py-1 text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono font-semibold text-gray-900">{subtotalFormatted}</span>
              </div>
              <div className="flex justify-between py-1 text-gray-600">
                <span>Value Added Tax (0%):</span>
                <span className="font-mono text-gray-500">0.00</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-gray-900 text-base sm:text-lg font-black text-gray-950">
                <span>Total Amount Due:</span>
                <span className="font-mono text-emerald-700">{totalFormatted}</span>
              </div>
              {invoice.status === "PAID" && (
                <div className="flex justify-between py-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2 rounded">
                  <span>Amount Received:</span>
                  <span className="font-mono">{totalFormatted}</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Real-World Payment Methods Section */}
        <section className="mt-6 pt-6 border-t-2 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          {/* Bank Transfer Instructions */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">
              Bank Transfer Instructions
            </h3>
            {bankDetails.hasDetails ? (
              <div className="space-y-2 text-xs">
                {bankDetails.accountNumber ? (
                  <div className="space-y-1 font-mono bg-white p-2.5 rounded border border-gray-200 text-xs">
                    <p><span className="font-sans font-medium text-gray-500">Bank:</span> <strong className="text-gray-900">{bankDetails.bankName || "Official Settlement Bank"}</strong></p>
                    <p><span className="font-sans font-medium text-gray-500">Account Number:</span> <strong className="text-emerald-700 font-bold">{bankDetails.accountNumber}</strong></p>
                    {bankDetails.accountName && (
                      <p><span className="font-sans font-medium text-gray-500">Account Name:</span> <strong className="text-gray-900">{bankDetails.accountName}</strong></p>
                    )}
                    <p><span className="font-sans font-medium text-gray-500">Reference:</span> <strong className="text-gray-900">{invoice.invoiceNumber}</strong></p>
                  </div>
                ) : null}

                {bankDetails.notes && (
                  <p className="text-gray-600 whitespace-pre-wrap break-words">{bankDetails.notes}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Please contact {invoice.business.name} at {invoice.business.email} for direct wire transfer instructions.
              </p>
            )}
          </div>

          {/* Online Payment / Verification */}
          <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
            <h3 className="font-bold text-xs uppercase tracking-wider text-gray-800">
              Online & Instant Payment
            </h3>
            <p className="text-gray-600">
              We accept debit/credit cards, instant bank transfers, and USSD via our secure payment gateway.
            </p>
            {invoice.paymentLinkUrl && (
              <div className="pt-2">
                <span className="block text-[11px] font-semibold text-gray-500 uppercase mb-1">
                  Payment Link:
                </span>
                <a
                  href={invoice.paymentLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-emerald-700 hover:underline break-all block p-2 bg-white rounded border border-gray-200"
                >
                  {invoice.paymentLinkUrl}
                </a>
              </div>
            )}
            <div className="flex items-center gap-1.5 pt-2 text-[11px] text-gray-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Payments are encrypted and processed with bank-level security.</span>
            </div>
          </div>
        </section>

        {/* Invoice Footer & Legal Notice */}
        <footer className="mt-10 pt-6 border-t border-gray-200 text-center text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">
            Thank you for choosing {invoice.business.name}!
          </p>
          <p>
            If you have any questions concerning this invoice, please reach out to{" "}
            <a href={`mailto:${invoice.business.email}`} className="text-emerald-700 underline">
              {invoice.business.email}
            </a>.
          </p>
          <p className="text-[10px] text-gray-400 font-mono pt-2">
            Generated by Settlevo Lead-to-Cash System · Invoice Reference: {invoice.invoiceNumber} · Created {formattedIssueDate} {formattedIssueTime}
          </p>
        </footer>
      </div>
    </div>
  );
}
