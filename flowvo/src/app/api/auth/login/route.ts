import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSession } from "@/lib/auth";
import { rateLimit, getClientIp, isSameOrigin } from "@/lib/security";

// ─── Validation ───────────────────────────────────────────────────────────────
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// ─── Rate limiting config ─────────────────────────────────────────────────────
// Max 5 login attempts per IP per 15 minutes (OWASP recommendation)
const LOGIN_LIMIT = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export async function POST(request: NextRequest) {
  // ── CSRF check ──────────────────────────────────────────────────────────────
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ── Rate limit ──────────────────────────────────────────────────────────────
  const ip = getClientIp(request);
  const { allowed, retryAfterMs } = rateLimit(`login:${ip}`, LOGIN_LIMIT, LOGIN_WINDOW_MS);

  if (!allowed) {
    const retrySecs = Math.ceil(retryAfterMs / 1000);
    return NextResponse.json(
      { error: `Too many login attempts. Please wait ${Math.ceil(retrySecs / 60)} minute(s) before trying again.` },
      {
        status: 429,
        headers: { "Retry-After": String(retrySecs) },
      }
    );
  }

  // ── Parse & validate ────────────────────────────────────────────────────────
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // ── Constant-time user lookup ────────────────────────────────────────────
    // Always run bcrypt.compare even if user not found to prevent timing attacks.
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    const DUMMY_HASH = "$2b$12$invalidhashfortimingprotection000000000000000000000000";
    const isValid = user
      ? await verifyPassword(password, user.passwordHash)
      : await verifyPassword(password, DUMMY_HASH).then(() => false);

    if (!user || !isValid) {
      // Generic message — don't reveal whether email exists
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    await createSession(user.id);
    return NextResponse.json({ ok: true, userId: user.id });

  } catch (err) {
    console.error("[login]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
