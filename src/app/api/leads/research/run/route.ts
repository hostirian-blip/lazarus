// POST /api/leads/research/run — assign cohorts to new leads and research the
// treatment cohort within the tenant's monthly spend cap.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { runResearchForNewLeads } from "@/lib/agents/research-runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const result = await runResearchForNewLeads(session.user.tenantId);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Research run failed", detail: (e as Error).message }, { status: 500 });
  }
}
