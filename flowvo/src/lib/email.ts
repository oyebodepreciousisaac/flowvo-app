import nodemailer from "nodemailer";

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
  const stagingOverride = process.env.STAGING_EMAIL_OVERRIDE;
  const recipient = stagingOverride && stagingOverride.trim().length > 0 ? stagingOverride : to;

  // Determine fallback reply-to
  const effectiveReplyTo = replyTo || process.env.REPLY_TO_EMAIL || process.env.GMAIL_USER || "preckidtech@gmail.com";

  // ─── 1. Gmail / Custom SMTP (Direct delivery from preckidtech@gmail.com) ──────
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER || "preckidtech@gmail.com";

  if (gmailPass && process.env.NODE_ENV !== "test") {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${fromName}" <${gmailUser}>`,
        to: recipient,
        subject,
        html,
        text,
        replyTo: effectiveReplyTo,
      });

      return { success: true, id: info.messageId };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "SMTP sending failed";
      console.error("[Email Error via Gmail SMTP]:", message);
      return { success: false, error: message };
    }
  }

  // ─── 2. Resend API ────────────────────────────────────────────────────────────
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || (process.env.EMAIL_FROM_DOMAIN ? `"${fromName}" <noreply@${process.env.EMAIL_FROM_DOMAIN}>` : "Flowvo <onboarding@resend.dev>");

  // In test environment or if no real key provided, simulate sending
  if (!resendApiKey || resendApiKey === "re_dev_placeholder" || process.env.NODE_ENV === "test") {
    console.log(`[Email Simulation] To: ${recipient} (original: ${to}), From: ${emailFrom}, Subject: ${subject}`);
    return { success: true, id: `mock-${Date.now()}` };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [recipient],
        subject,
        html,
        text,
        reply_to: effectiveReplyTo,
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
