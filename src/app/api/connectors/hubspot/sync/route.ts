// POST /api/connectors/hubspot/sync — pull the tenant's HubSpot contacts into Leads.
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
  const connector = await getTenantConnector(session.user.tenantId);
  if (!connector) {
    return NextResponse.json({ error: "HubSpot is not connected for this tenant." }, { status: 409 });
  }
  try {
    const result = await syncLeads(tenantDb(session.user.tenantId), connector);
    await db.crmConnection.update({
      where: { tenantId: session.user.tenantId },
      data: { lastSyncedAt: new Date() },
    }).catch(() => {});
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Sync failed", detail: (e as Error).message }, { status: 502 });
  }
}
