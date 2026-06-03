// GET /api/auth/verify?token=... — confirm a user's email, then redirect to login.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { consumeAuthToken } from "@/lib/auth/tokens";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = await consumeAuthToken(url.searchParams.get("token") ?? "", "verify");
  if (userId) {
    await db.user.update({ where: { id: userId }, data: { emailVerified: true } }).catch(() => {});
  }
  const dest = new URL("/login", url.origin);
  dest.searchParams.set("verified", userId ? "1" : "0");
  return NextResponse.redirect(dest);
}
