import { formatPence } from "./quote-email";

export function quoteFollowUpHtml({
  customerName,
  businessName,
  serviceType,
  totalPence,
  acceptUrl,
}: {
  customerName: string;
  businessName: string;
  serviceType?: string;
  totalPence: number;
  acceptUrl: string;
}): string {
  const firstName = customerName.split(" ")[0] || "there";
  const serviceMention = serviceType ? ` regarding ${serviceType}` : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Following up on your quote from ${businessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d1a; background-color: #f7f8f7; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #d8dcdb; border-radius: 8px; padding: 32px;">
    <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 700; color: #1a1d1a;">
      Following up on your quote
    </h2>
    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Hi ${firstName},
    </p>
    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Just checking in regarding the quote we sent a few days ago${serviceMention} (Total: <strong>${formatPence(totalPence)}</strong>).
    </p>
    <p style="margin: 0 0 24px; font-size: 15px; color: #4a5150;">
      We wanted to see if you had any questions or if you would like to get this scheduled into our calendar.
    </p>

    <div style="text-align: center; margin: 32px 0 24px;">
      <a href="${acceptUrl}" style="display: inline-block; background-color: #1e7a6a; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 6px;">
        Review & Accept Quote
      </a>
    </div>

    <p style="margin: 0; font-size: 13px; color: #7a8580; text-align: center;">
      If you need any adjustments or have decided not to proceed, simply reply to let us know.
    </p>
  </div>
</body>
</html>`;
}

export function quoteFollowUpText({
  customerName,
  businessName,
  serviceType,
  totalPence,
  acceptUrl,
}: {
  customerName: string;
  businessName: string;
  serviceType?: string;
  totalPence: number;
  acceptUrl: string;
}): string {
  const firstName = customerName.split(" ")[0] || "there";
  const serviceMention = serviceType ? ` regarding ${serviceType}` : "";

  return `Following up on your quote from ${businessName}

Hi ${firstName},

Just checking in regarding the quote we sent a few days ago${serviceMention} (Total: ${formatPence(totalPence)}).

We wanted to see if you had any questions or if you would like to get this scheduled into our calendar.

You can review and accept the quote here:
${acceptUrl}

If you need any adjustments or have decided not to proceed, simply reply to let us know.

Best regards,
${businessName}`;
}
