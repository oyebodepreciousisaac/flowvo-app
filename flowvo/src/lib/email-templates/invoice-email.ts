import { formatPence, LineItem } from "./quote-email";
import { escapeHtml } from "@/lib/security";
import { formatAmount, getCurrencySymbol } from "@/lib/currency";

export function invoiceEmailHtml({
  invoiceNumber,
  customerName,
  businessName,
  lineItems,
  totalPence,
  dueDate,
  paymentDetails,
  currency = "GBP",
  paymentLinkUrl,
  viewInvoiceUrl,
}: {
  invoiceNumber: string;
  customerName: string;
  businessName: string;
  lineItems: LineItem[];
  totalPence: number;
  dueDate: Date;
  paymentDetails?: string | null;
  currency?: string;
  paymentLinkUrl?: string | null;
  viewInvoiceUrl?: string | null;
}): string {
  const safeInvoiceNumber = escapeHtml(invoiceNumber);
  const safeBusinessName = escapeHtml(businessName);
  const firstName = escapeHtml(customerName.split(" ")[0] || "there");
  const safePaymentDetails = paymentDetails ? escapeHtml(paymentDetails) : null;
  const currencySymbol = getCurrencySymbol(currency);
  const actionUrl = viewInvoiceUrl || paymentLinkUrl;
  const dueDateStr = new Date(dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const rows = lineItems
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px;">
        ${escapeHtml(item.description)}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: center;">
        ${item.quantity}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: right;">
        ${formatAmount(item.unitPricePence, currency)}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">
        ${formatAmount(item.lineTotalPence, currency)}
      </td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Invoice ${safeInvoiceNumber} from ${safeBusinessName}</title>
  <style>
    @media only screen and (max-width: 600px) {
      body {
        padding: 12px 8px !important;
      }
      .email-wrapper {
        width: 100% !important;
        padding: 20px 16px !important;
        border-radius: 6px !important;
      }
      .table-cell-desc {
        font-size: 13px !important;
        padding: 8px 6px !important;
      }
      .table-cell-qty, .table-cell-rate {
        display: none !important;
      }
      .table-cell-total {
        font-size: 13px !important;
        padding: 8px 6px !important;
      }
      .table-header-qty, .table-header-rate {
        display: none !important;
      }
      .table-footer-label {
        font-size: 14px !important;
        padding: 12px 6px !important;
      }
      .table-footer-total {
        font-size: 17px !important;
        padding: 12px 6px !important;
      }
      .cta-btn {
        display: block !important;
        width: 100% !important;
        min-height: 48px !important;
        line-height: 48px !important;
        padding: 0 16px !important;
        font-size: 15px !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d1a; background-color: #f7f8f7; margin: 0; padding: 24px;">
  <div class="email-wrapper" style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #d8dcdb; border-radius: 8px; padding: 32px; box-sizing: border-box;">
    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 24px; flex-wrap: wrap; gap: 8px;">
      <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: #1a1d1a;">
        Invoice ${safeInvoiceNumber}
      </h2>
      <span style="font-size: 14px; font-weight: 600; color: #1e7a6a;">
        ${safeBusinessName}
      </span>
    </div>

    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Hi ${firstName},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4a5150;">
      Thank you for your business. Please find attached the itemized invoice for completed work. Payment is due by <strong>${dueDateStr}</strong>.
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f0f1f0;">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Description</th>
          <th class="table-header-qty" style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Qty</th>
          <th class="table-header-rate" style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Rate</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems
          .map(
            (item) => `
        <tr>
          <td class="table-cell-desc" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; word-break: break-word;">
            ${escapeHtml(item.description)}
          </td>
          <td class="table-cell-qty" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: center;">
            ${item.quantity}
          </td>
          <td class="table-cell-rate" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: right; white-space: nowrap;">
            ${formatAmount(item.unitPricePence, currency)}
          </td>
          <td class="table-cell-total" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600; text-align: right; white-space: nowrap;">
            ${formatAmount(item.lineTotalPence, currency)}
          </td>
        </tr>`
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="table-footer-label" style="padding: 14px 12px; text-align: right; font-size: 15px; font-weight: 700; color: #1a1d1a;">
            Total Due:
          </td>
          <td class="table-footer-total" style="padding: 14px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #1e7a6a; white-space: nowrap;">
            ${formatAmount(totalPence, currency)}
          </td>
        </tr>
      </tfoot>
    </table>

    ${
      actionUrl
        ? `<div style="text-align: center; margin: 32px 0 28px;">
        <a href="${actionUrl}" class="cta-btn" style="display: inline-block; background-color: #1e7a6a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); box-sizing: border-box;">
          ${viewInvoiceUrl ? `View Invoice &amp; Pay Online (${currencySymbol})` : `Pay Online Now (${currencySymbol}) — Card / Transfer / USSD`}
        </a>
      </div>`
        : ""
    }

    ${
      safePaymentDetails
        ? `<div style="background-color: #f0f1f0; border-radius: 6px; padding: 16px; margin: 24px 0; word-break: break-word;">
        <h4 style="margin: 0 0 8px; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">
          Direct Bank Payment Details
        </h4>
        <div style="font-size: 13px; color: #1a1d1a; white-space: pre-wrap; font-family: monospace;">${safePaymentDetails}</div>
      </div>`
        : ""
    }

    <p style="margin: 24px 0 0; font-size: 13px; color: #7a8580; text-align: center; line-height: 1.5;">
      If you have questions regarding this invoice, reply directly to this email.
    </p>
  </div>
</body>
</html>`;
}

export function invoiceEmailText({
  invoiceNumber,
  customerName,
  businessName,
  lineItems,
  totalPence,
  dueDate,
  paymentDetails,
  currency = "GBP",
  paymentLinkUrl,
  viewInvoiceUrl,
}: {
  invoiceNumber: string;
  customerName: string;
  businessName: string;
  lineItems: LineItem[];
  totalPence: number;
  dueDate: Date;
  paymentDetails?: string | null;
  currency?: string;
  paymentLinkUrl?: string | null;
  viewInvoiceUrl?: string | null;
}): string {
  const firstName = customerName.split(" ")[0] || "there";
  const dueDateStr = new Date(dueDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemsText = lineItems
    .map(
      (item) =>
        `- ${item.description}: ${item.quantity} x ${formatAmount(item.unitPricePence, currency)} = ${formatAmount(item.lineTotalPence, currency)}`
    )
    .join("\n");

  const actionUrl = viewInvoiceUrl || paymentLinkUrl;

  return `Invoice ${invoiceNumber} from ${businessName}

Hi ${firstName},

Thank you for your business. Please find below the itemized invoice for completed work. Payment is due by ${dueDateStr}.

${itemsText}

Total Due: ${formatAmount(totalPence, currency)}

${actionUrl ? `View & Pay Invoice Online:\n${actionUrl}\n\n` : ""}${paymentDetails ? `Direct Bank Transfer Details:\n${paymentDetails}\n\n` : ""}If you have questions, reply directly to this email.

Best regards,
${businessName}`;
}
