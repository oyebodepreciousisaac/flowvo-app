import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { rateLimit, getClientIp, isSameOrigin } from "@/lib/security";

const FORGOT_LIMIT = 3;
const FORGOT_WINDOW_MS = 60 * 60 * 1000; // 3 attempts per IP per hour

const forgotSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ip = getClientIp(request);
  const { allowed } = rateLimit(`forgot:${ip}`, FORGOT_LIMIT, FORGOT_WINDOW_MS);
  // Still return 200 so attackers can't detect rate limiting on this endpoint
  if (!allowed) return NextResponse.json({ ok: true });

  try {
    const body = await request.json();
    const parsed = forgotSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    const { email } = parsed.data;

    // Always return 200 — don't leak whether an account exists
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // Invalidate any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({ where: { email: email.toLowerCase() } });

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordResetToken.create({
      data: { token, email: email.toLowerCase(), expires },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/reset-password/${token}`;

    await sendEmail({
      to: email,
      subject: "Reset your Settlevo password",
      html: `
        <p>Hi,</p>
        <p>You requested a password reset for your Settlevo account. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}" style="color:#1E7A6A;font-weight:600;">Reset my password</a></p>
        <p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>
        <p>— The Settlevo team</p>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
