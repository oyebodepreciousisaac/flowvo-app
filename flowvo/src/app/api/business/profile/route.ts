import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { isValidGoogleReviewUrl } from "@/lib/review";

const profileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  email: z.string().email("A valid business email is required"),
  paymentDetails: z.string().max(1000).optional().nullable(),
  googleReviewUrl: z
    .string()
    .max(500)
    .optional()
    .nullable()
    .refine(
      (val) => !val || val.trim() === "" || isValidGoogleReviewUrl(val),
      "Must be a valid Google review link (e.g. https://g.page/r/... or https://maps.app.goo.gl/...)"
    ),
});

export async function PATCH(request: NextRequest) {
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

  const result = profileSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json(
      { error: "Validation failed", fields: result.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const updated = await prisma.business.update({
    where: { id: session.user.businessId },
    data: {
      name: result.data.name,
      email: result.data.email,
      paymentDetails: result.data.paymentDetails,
      googleReviewUrl: result.data.googleReviewUrl ? result.data.googleReviewUrl.trim() : null,
    },
  });

  return NextResponse.json({ ok: true, business: updated });
}
