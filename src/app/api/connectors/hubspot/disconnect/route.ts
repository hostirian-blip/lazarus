// POST /api/connectors/hubspot/disconnect — remove this tenant's HubSpot connection.
// Deletes the stored (encrypted) tokens. Imported leads are kept.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db.crmConnection.deleteMany({ where: { tenantId: session.user.tenantId } });
  return NextResponse.json({ ok: true });
}
