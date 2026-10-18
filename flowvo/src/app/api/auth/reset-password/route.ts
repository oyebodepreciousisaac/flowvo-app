import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { strongPasswordSchema } from "@/lib/password";
import { isSameOrigin, rateLimit, getClientIp } from "@/lib/security";

const resetSchema = z.object({
  token: z.string().min(1),
  password: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const RESET_LIMIT = 5;
const RESET_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  // ── CSRF check ──────────────────────────────────────────────────────────────
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`reset-pwd:${ip}`, RESET_LIMIT, RESET_WINDOW_MS);
  if (!allowed) {
    const retrySecs = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Too many password reset attempts. Please wait ${Math.ceil(retrySecs / 60)} minute(s) before trying again.` },
      {
        status: 429,
        headers: { "Retry-After": String(retrySecs) },
      }
    );
  }

  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    const resetToken = await prisma.passwordResetToken.findUnique({ where: { token } });

    if (!resetToken || resetToken.expires < new Date()) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { email: resetToken.email },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.delete({ where: { token } }),
      // Invalidate all existing sessions for this user
      prisma.session.deleteMany({
        where: {
          user: { email: resetToken.email },
        },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
