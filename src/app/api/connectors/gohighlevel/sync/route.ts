// POST /api/connectors/gohighlevel/sync — pull the tenant's GHL contacts into Leads.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tenantDb } from "@/lib/tenant";
import { getTenantConnector } from "@/lib/connectors";
import { syncLeads } from "@/lib/connectors/sync";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const connector = await getTenantConnector(session.user.tenantId, "gohighlevel");
  if (!connector) {
    return NextResponse.json({ error: "GoHighLevel is not connected for this tenant." }, { status: 409 });
  }
  try {
    const result = await syncLeads(tenantDb(session.user.tenantId), connector);
    await db.crmConnection.update({
      where: { tenantId_provider: { tenantId: session.user.tenantId, provider: "gohighlevel" } },
      data: { lastSyncedAt: new Date() },
    }).catch(() => {});
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Sync failed", detail: (e as Error).message }, { status: 502 });
  }
}
