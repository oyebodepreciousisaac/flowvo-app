export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  fromName = "Flowvo",
  replyTo,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const fromDomain = process.env.EMAIL_FROM_DOMAIN || "mail.flowvo.app";
  const stagingOverride = process.env.STAGING_EMAIL_OVERRIDE;

  const recipient = stagingOverride && stagingOverride.trim().length > 0 ? stagingOverride : to;
  const sender = `"${fromName}" <noreply@${fromDomain}>`;

  // If in dev or test without a real Resend key, simulate successful send and log to console
  if (!apiKey || apiKey === "re_dev_placeholder" || process.env.NODE_ENV === "test") {
    console.log(`[Email Simulation] To: ${recipient} (original: ${to}), From: ${sender}, Subject: ${subject}`);
    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        subject,
        html,
        text,
        reply_to: replyTo,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data?.message || "Failed to send email" };
    }

    return { success: true, id: data?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error sending email";
    return { success: false, error: message };
  }
}
