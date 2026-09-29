/**
 * Email template for lead acknowledgement sent to the customer.
 * No Flowvo branding in the body per spec.
 *
 * Security: all user-supplied strings (firstName, serviceType) are HTML-escaped
 * before interpolation to prevent stored XSS via email clients that render HTML.
 */
import { escapeHtml } from "@/lib/security";

export function leadAcknowledgementHtml({
  firstName,
  businessName,
  serviceType,
}: {
  firstName: string;
  businessName: string;
  serviceType: string;
}): string {
  const safeFirst = escapeHtml(firstName);
  const safeBusiness = escapeHtml(businessName);
  const safeService = escapeHtml(serviceType);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We've received your enquiry</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; background: #f5f5f5; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e5e7eb; }
    .body { padding: 32px 32px 24px; }
    p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .footer { padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
    .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="body">
      <p>Hi ${safeFirst},</p>
      <p>Thanks for getting in touch about <strong>${safeService}</strong>. We've received your enquiry and will be in touch shortly.</p>
      <p>If you need to reach us in the meantime, just reply to this email.</p>
      <p>Kind regards,<br /><strong>${safeBusiness}</strong></p>
    </div>
    <div class="footer">
      <p>You're receiving this because you submitted an enquiry to ${safeBusiness}.</p>
    </div>
  </div>
</body>
</html>`;
}

export function leadAcknowledgementText({
  firstName,
  businessName,
  serviceType,
}: {
  firstName: string;
  businessName: string;
  serviceType: string;
}): string {
  // Plain text version — no escaping needed, XSS only applies to HTML
  return `Hi ${firstName},

Thanks for getting in touch about ${serviceType}. We've received your enquiry and will be in touch shortly.

If you need to reach us in the meantime, just reply to this email.

Kind regards,
${businessName}`;
}
