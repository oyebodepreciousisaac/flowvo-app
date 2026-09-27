export interface ReviewReminderEmailProps {
  customerName: string;
  businessName: string;
  serviceType?: string | null;
  googleReviewUrl: string;
  unsubscribeUrl: string;
}

export function reviewReminderHtml({
  customerName,
  businessName,
  googleReviewUrl,
  unsubscribeUrl,
}: ReviewReminderEmailProps): string {
  const firstName = customerName.split(" ")[0] || "there";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Quick follow-up — ${businessName}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a1d1a; background-color: #f7f8f7; margin: 0; padding: 24px;">
  <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #d8dcdb; border-radius: 8px; padding: 32px;">
    <div style="margin-bottom: 24px;">
      <span style="font-size: 14px; font-weight: 700; color: #1e7a6a; letter-spacing: 0.02em; text-transform: uppercase;">
        ${businessName}
      </span>
      <h2 style="margin: 8px 0 0; font-size: 20px; font-weight: 700; color: #1a1d1a;">
        Quick question about your recent experience
      </h2>
    </div>

    <p style="margin: 0 0 16px; font-size: 15px; color: #4a5150;">
      Hi ${firstName},
    </p>

    <p style="margin: 0 0 20px; font-size: 15px; color: #4a5150;">
      We know you're busy! This is just a gentle reminder in case you had a spare moment to share a quick rating or sentence on Google about your experience with us.
    </p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="${googleReviewUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #1e7a6a; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 12px 24px; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        ★ Leave a quick Google review
      </a>
    </div>

    <p style="margin: 0 0 24px; font-size: 14px; color: #4a5150;">
      Thank you for supporting our business,
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

export function reviewReminderText({
  customerName,
  businessName,
  googleReviewUrl,
  unsubscribeUrl,
}: ReviewReminderEmailProps): string {
  const firstName = customerName.split(" ")[0] || "there";

  return `Hi ${firstName},

Just a gentle follow-up in case you had a spare moment to share a quick review on Google about your recent experience with ${businessName}.

Leave a quick review:
${googleReviewUrl}

Thank you for your support,
${businessName}

---
Not interested? Unsubscribe from future review requests here:
${unsubscribeUrl}
`;
}
