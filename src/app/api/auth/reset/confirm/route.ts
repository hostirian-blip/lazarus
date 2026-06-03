// POST /api/auth/reset/confirm { token, password } — set a new password.
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth/tokens";
import { rateLimit, clientIp } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!rateLimit("resetc:" + clientIp(req), 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { token?: string; password?: string } | null;
  const password = body?.password ?? "";
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });

  const userId = await consumeAuthToken(String(body?.token ?? ""), "reset");
  if (!userId) return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 });

  const passwordHash = await bcrypt.hash(password, 12);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });
  return NextResponse.json({ ok: true });
}
