import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const profileSchema = z.object({
  name: z.string().min(2, "Business name must be at least 2 characters").max(100),
  email: z.string().email("A valid business email is required"),
  paymentDetails: z.string().max(1000).optional().nullable(),
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
    },
  });

  return NextResponse.json({ ok: true, business: updated });
}
