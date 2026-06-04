// GET /api/connectors/gohighlevel/start — kick off GoHighLevel OAuth for the tenant.
import { NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenant";
import { getGhlConfig, buildGhlAuthUrl, signState } from "@/lib/connectors/gohighlevel-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tenantId = await requireTenantId(); // redirects to /login if unauthenticated
  const cfg = await getGhlConfig();
  if (!cfg) {
    const settings = new URL("/dashboard/settings", new URL(req.url).origin);
    settings.searchParams.set("gohighlevel", "unconfigured");
    return NextResponse.redirect(settings);
  }
  return NextResponse.redirect(buildGhlAuthUrl(cfg, signState(tenantId)));
}
