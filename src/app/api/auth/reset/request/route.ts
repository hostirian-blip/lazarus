// POST /api/auth/reset/request { email } — emails a reset link if the account
// exists. Always returns ok (no account enumeration). Rate-limited.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAuthToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/email/send";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!rateLimit("reset:" + clientIp(req), 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.toLowerCase().trim();
  if (email && email.includes("@")) {
    const user = await db.user.findUnique({ where: { email } });
    if (user) {
      const token = await createAuthToken(user.id, "reset", 60 * 60 * 1000);
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your Lazarus password",
          body: `Reset your password (link expires in 1 hour):\n${base}/reset/confirm?token=${token}`,
        });
      } catch {
        /* email not configured — link simply isn't delivered */
      }
    }
  }
  return NextResponse.json({ ok: true });
}
