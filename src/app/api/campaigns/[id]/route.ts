// PATCH /api/campaigns/:id (name/active/sequence) · DELETE /api/campaigns/:id.
// Scoped by tenantId in the where clause so a tenant can only touch its own rows.
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Step = z.object({
  channel: z.enum(["sms", "email"]),
  delayHours: z.number().int().min(0),
  body: z.string().max(2000),
});
const Patch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  active: z.boolean().optional(),
  sequence: z.array(Step).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Prisma.CampaignUpdateManyMutationInput = {};
  if (parsed.data.name !== undefined) data.name = parsed.data.name;
  if (parsed.data.active !== undefined) data.active = parsed.data.active;
  if (parsed.data.sequence !== undefined) data.sequence = parsed.data.sequence as unknown as Prisma.InputJsonValue;

  const r = await db.campaign.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data });
  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const r = await db.campaign.deleteMany({ where: { id: params.id, tenantId: session.user.tenantId } });
  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
