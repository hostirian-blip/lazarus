// PATCH /api/leads/:id — update a lead's revenue + status (tenant-scoped).
import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const Patch = z.object({
  revenueCents: z.number().int().min(0).optional(),
  status: z.enum(["new", "researching", "queued", "engaged", "replied", "booked", "dead"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Patch.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const data: Prisma.LeadUpdateManyMutationInput = {};
  if (parsed.data.revenueCents !== undefined) data.revenueCents = parsed.data.revenueCents;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;

  const r = await db.lead.updateMany({ where: { id: params.id, tenantId: session.user.tenantId }, data });
  if (r.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
