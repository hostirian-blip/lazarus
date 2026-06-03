// POST /api/leads/send  { leadId, channel } — draft + send one message to a lead,
// gated by consent. Tenant-scoped: the lead must belong to the caller's tenant.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenantDb } from "@/lib/tenant";
import { dispatchToLead } from "@/lib/send/dispatch";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as { leadId?: string; channel?: string } | null;
  const channel = body?.channel;
  if (!body?.leadId || (channel !== "sms" && channel !== "email")) {
    return NextResponse.json({ error: "Provide leadId and channel ('sms'|'email')" }, { status: 400 });
  }

  const scoped = tenantDb(session.user.tenantId);
  const lead = await scoped.lead.findFirst({ where: { id: body.leadId } });
  if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: session.user.tenantId } });
  const result = await dispatchToLead({ scoped, tenant, lead, channel });
  return NextResponse.json(result);
}
