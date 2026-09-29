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
  <title>Quote from ${safeBusinessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d1a; background-color: #f7f8f7; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #d8dcdb; border-radius: 8px; padding: 32px;">
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #1a1d1a;">
      Quote from ${safeBusinessName}
    </h2>
    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Hi ${firstName},
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4a5150;">
      Thank you for your enquiry. We are pleased to provide the following quote for your review:
    </p>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
      <thead>
        <tr style="background-color: #f0f1f0;">
          <th style="padding: 10px 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Description</th>
          <th style="padding: 10px 12px; text-align: center; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Qty</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Rate</th>
          <th style="padding: 10px 12px; text-align: right; font-size: 12px; text-transform: uppercase; color: #4a5150; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="padding: 14px 12px; text-align: right; font-size: 15px; font-weight: 700; color: #1a1d1a;">
            Total:
          </td>
          <td style="padding: 14px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #1e7a6a;">
            ${formatPence(totalPence, currency)}
          </td>
        </tr>
      </tfoot>
    </table>

    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${acceptUrl}" style="display: inline-block; background-color: #1e7a6a; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px;">
        Review & Accept Quote
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #7a8580; text-align: center;">
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
