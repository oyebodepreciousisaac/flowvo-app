import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession, verifyPassword, hashPassword, destroySession, createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { strongPasswordSchema } from "@/lib/password";
import { isSameOrigin } from "@/lib/security";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPasswordSchema,
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  // CSRF check
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const result = changePasswordSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { currentPassword, newPassword } = result.data;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Current password is incorrect", fields: { currentPassword: ["Current password is incorrect"] } },
      { status: 422 }
    );
  }

  const newHash = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  // Session rotation — invalidate the old token and issue a fresh one.
  // An attacker who stole the session cookie before this change now loses access.
  await destroySession();
  await createSession(user.id);

  return NextResponse.json({ ok: true, message: "Password updated successfully" });
}
