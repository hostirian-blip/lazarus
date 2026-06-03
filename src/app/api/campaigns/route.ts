// GET /api/campaigns (list) · POST /api/campaigns (create) — tenant-scoped.
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaigns = await tenantDb(session.user.tenantId).campaign.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ campaigns });
}

const Create = z.object({ name: z.string().trim().min(1).max(120) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Create.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
  const campaign = await tenantDb(session.user.tenantId).campaign.create({
    name: parsed.data.name,
    sequence: [] as unknown as Prisma.InputJsonValue,
    active: false,
    sendMode: "internal",
  });
  return NextResponse.json({ ok: true, campaign }, { status: 201 });
}
