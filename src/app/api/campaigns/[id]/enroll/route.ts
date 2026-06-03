// POST /api/campaigns/:id/enroll — launch: enroll the tenant's eligible leads.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { enrollLeadsInCampaign } from "@/lib/engine/enroll";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await enrollLeadsInCampaign(session.user.tenantId, params.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
