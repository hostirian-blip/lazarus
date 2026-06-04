// Admin-only user management.
//   GET  -> list every user (across all tenants) with role + tenant.
//   POST -> create a new user (typically another admin). Body:
//           { email, name?, password, role: "admin"|"user", tenantId }
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (session.user.role !== "admin") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  return { session };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const users = await db.user.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      emailVerified: true,
      createdAt: true,
      tenant: { select: { id: true, name: true } },
    },
  });
  return NextResponse.json({ users });
}

const CreateBody = z.object({
  email: z.string().trim().email(),
  name: z.string().trim().max(120).optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "user"]).default("admin"),
  tenantId: z.string().trim().min(1, "Tenant is required"),
});

export async function POST(req: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const parsed = CreateBody.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors }, { status: 400 });
  }
  const { email, name, password, role, tenantId } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 400 });

  const existing = await db.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.create({
    data: { email: normalizedEmail, name, passwordHash, role, emailVerified: true, tenantId },
    select: { id: true, email: true, name: true, role: true },
  });
  return NextResponse.json({ ok: true, user }, { status: 201 });
}
