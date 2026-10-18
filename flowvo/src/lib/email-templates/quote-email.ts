import { escapeHtml } from "@/lib/security";
import { formatAmount } from "@/lib/currency";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPricePence: number;
  lineTotalPence: number;
}

export function formatPence(pence: number, currency: string = "GBP"): string {
  return formatAmount(pence, currency);
}

export function quoteEmailHtml({
  customerName,
  businessName,
  lineItems,
  totalPence,
  acceptUrl,
  currency = "GBP",
}: {
  customerName: string;
  businessName: string;
  lineItems: LineItem[];
  totalPence: number;
  acceptUrl: string;
  currency?: string;
}): string {
  const safeBusinessName = escapeHtml(businessName);
  const firstName = escapeHtml(customerName.split(" ")[0] || "there");

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
        ${formatPence(item.unitPricePence, currency)}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600; text-align: right;">
        ${formatPence(item.lineTotalPence, currency)}
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
  <title>Quote from ${safeBusinessName}</title>
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
        font-size: 16px !important;
        box-sizing: border-box !important;
        text-align: center !important;
      }
    }
  </style>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d1a; background-color: #f7f8f7; margin: 0; padding: 24px;">
  <div class="email-wrapper" style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #d8dcdb; border-radius: 8px; padding: 32px; box-sizing: border-box;">
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #1a1d1a;">
      Quote from ${safeBusinessName}
    </h2>
    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Hi ${firstName},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4a5150;">
      Thank you for your enquiry. We are pleased to provide the following itemized quote for your review:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f0f1f0;">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Description</th>
          <th class="table-header-qty" style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Qty</th>
          <th class="table-header-rate" style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Rate</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${lineItems
          .map(
            (item) => `
        <tr>
          <td class="table-cell-desc" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #1f2937; font-size: 14px; word-break: break-word;">
            ${escapeHtml(item.description)}
            <div style="font-size: 11px; color: #6b7280; display: none;" class="mobile-only-qty">
              ${item.quantity} × ${formatPence(item.unitPricePence, currency)}
            </div>
          </td>
          <td class="table-cell-qty" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: center;">
            ${item.quantity}
          </td>
          <td class="table-cell-rate" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #4b5563; font-size: 14px; text-align: right; white-space: nowrap;">
            ${formatPence(item.unitPricePence, currency)}
          </td>
          <td class="table-cell-total" style="padding: 10px 12px; border-bottom: 1px solid #e5e7eb; color: #111827; font-size: 14px; font-weight: 600; text-align: right; white-space: nowrap;">
            ${formatPence(item.lineTotalPence, currency)}
          </td>
        </tr>`
          )
          .join("")}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" class="table-footer-label" style="padding: 14px 12px; text-align: right; font-size: 15px; font-weight: 700; color: #1a1d1a;">
            Total:
          </td>
          <td class="table-footer-total" style="padding: 14px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #1e7a6a; white-space: nowrap;">
            ${formatPence(totalPence, currency)}
          </td>
        </tr>
      </tfoot>
    </table>

    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${acceptUrl}" class="cta-btn" style="display: inline-block; background-color: #1e7a6a; color: #ffffff; text-decoration: none; padding: 14px 32px; font-size: 15px; font-weight: 700; border-radius: 6px; box-sizing: border-box;">
        Review &amp; Accept Quote
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #7a8580; text-align: center; line-height: 1.5;">
      If you have questions or need adjustments, reply directly to this email.
    </p>
  </div>
</body>
</html>`;
}

export function quoteEmailText({
  customerName,
  businessName,
  lineItems,
  totalPence,
  acceptUrl,
  currency = "GBP",
}: {
  customerName: string;
  businessName: string;
  lineItems: LineItem[];
  totalPence: number;
  acceptUrl: string;
  currency?: string;
}): string {
  const firstName = customerName.split(" ")[0] || "there";

  const itemsText = lineItems
    .map(
      (item) =>
        `- ${item.description}: ${item.quantity} x ${formatPence(item.unitPricePence, currency)} = ${formatPence(item.lineTotalPence, currency)}`
    )
    .join("\n");

  return `Quote from ${businessName}

Hi ${firstName},

Thank you for your enquiry. We are pleased to provide the following quote:

${itemsText}

Total: ${formatPence(totalPence, currency)}

To review and accept this quote, visit:
${acceptUrl}

If you have questions or need adjustments, reply directly to this email.

Best regards,
${businessName}`;
}
