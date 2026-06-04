// Admin-only: change a user's platform role. Body: { role: "admin"|"user" }.
// Guards: you cannot change your own role, and you cannot demote the last admin.
import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Body = z.object({ role: z.enum(["admin", "user"]) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  const { role } = parsed.data;

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
  }

  const target = await db.user.findUnique({ where: { id: params.id }, select: { id: true, role: true } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Never leave the platform without an admin.
  if (target.role === "admin" && role === "user") {
    const adminCount = await db.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Cannot demote the last remaining admin." }, { status: 400 });
    }
  }

  const user = await db.user.update({
    where: { id: params.id },
    data: { role },
    select: { id: true, email: true, role: true },
  });
  return NextResponse.json({ ok: true, user });
}
