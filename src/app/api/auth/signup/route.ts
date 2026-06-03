// Self-serve sign-up: creating an account creates a brand-new Tenant and the
// first User inside it (atomically). This is the entry point to the platform.
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { rateLimit, clientIp } from "@/lib/ratelimit";

const Body = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(120),
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  if (!rateLimit("signup:" + clientIp(req), 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { companyName, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // One transaction: new tenant + its first user.
  const tenant = await db.tenant.create({
    data: {
      name: companyName,
      users: { create: { email: normalizedEmail, name, passwordHash } },
    },
    select: { id: true, users: { select: { id: true } } },
  });

  // Best-effort email verification link (delivered only if email is configured).
  try {
    const userId = tenant.users[0]?.id;
    if (userId) {
      const token = await createAuthToken(userId, "verify", 24 * 60 * 60 * 1000);
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      await sendEmail({ to: normalizedEmail, subject: "Verify your Lazarus email", body: `Confirm your email:\n${base}/api/auth/verify?token=${token}` });
    }
  } catch {
    /* email not configured */
  }

  return NextResponse.json({ ok: true, tenantId: tenant.id }, { status: 201 });
}
