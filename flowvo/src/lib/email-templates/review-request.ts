import { escapeHtml } from "@/lib/security";

export interface ReviewRequestEmailProps {
  customerName: string;
  businessName: string;
  serviceType?: string | null;
  googleReviewUrl: string;
  unsubscribeUrl: string;
}

export function reviewRequestHtml({
  customerName,
  businessName,
  serviceType,
  googleReviewUrl,
  unsubscribeUrl,
}: ReviewRequestEmailProps): string {
  const safeBusinessName = escapeHtml(businessName);
  const firstName = escapeHtml(customerName.split(" ")[0] || "there");
  const serviceMention = serviceType
    ? ` with your <strong>${escapeHtml(serviceType)}</strong>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>How did we do? — ${safeBusinessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d1a; background-color: #f7f8f7; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #d8dcdb; border-radius: 8px; padding: 32px;">
    <div style="margin-bottom: 24px;">
      <span style="font-size: 14px; font-weight: 700; color: #1e7a6a; letter-spacing: 0.02em; text-transform: uppercase;">
        ${safeBusinessName}
      </span>
      <h2 style="margin: 8px 0 0; font-size: 22px; font-weight: 700; color: #1a1d1a;">
        Thank you for choosing us!
      </h2>
    </div>

    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Hi ${firstName},
    </p>

    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Thank you for your recent payment. We hope you are delighted${serviceMention}.
    </p>

    <p style="margin: 0 0 24px; font-size: 15px; color: #4a5150;">
      As an independent business, online reviews help local customers find and trust us. If you have 60 seconds, we would genuinely appreciate your feedback on Google!
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <a href="${googleReviewUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1e7a6a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ★ Leave us a Google review
      </a>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; color: #4a5150;">
      Thanks again for your business,
      <br>
      <strong>${businessName}</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0 16px;">

    <p style="margin: 0; font-size: 12px; color: #7a8580; text-align: center;">
      Not interested? <a href="${unsubscribeUrl}" style="color: #4a5150; text-decoration: underline;">Click here</a> to unsubscribe from future review requests.
    </p>
  </div>
</body>
</html>`;
}

export function reviewRequestText({
  customerName,
  businessName,
  serviceType,
  googleReviewUrl,
  unsubscribeUrl,
}: ReviewRequestEmailProps): string {
  const firstName = customerName.split(" ")[0] || "there";
  const serviceMention = serviceType ? ` with your ${serviceType}` : "";

  return `Hi ${firstName},

Thank you for your recent payment. We hope you are delighted${serviceMention}.

As an independent business, online reviews help local customers find and trust us. If you have 60 seconds, we would genuinely appreciate your feedback on Google:

Leave us a Google review:
${googleReviewUrl}

Thanks again for your business,
${businessName}

---
Not interested? Unsubscribe from future review requests here:
${unsubscribeUrl}
`;
}
