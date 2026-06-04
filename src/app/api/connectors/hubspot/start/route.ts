// GET /api/connectors/hubspot/start — kick off HubSpot OAuth for the current tenant.
import { NextResponse } from "next/server";
import { requireTenantId } from "@/lib/tenant";
import { getHubSpotConfig, buildAuthUrl, signState } from "@/lib/connectors/hubspot-oauth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const tenantId = await requireTenantId(); // redirects to /login if unauthenticated
  const cfg = await getHubSpotConfig();
  if (!cfg) {
    // Friendly redirect (this is a browser navigation), surfaced as a banner.
    const settings = new URL("/dashboard/settings", new URL(req.url).origin);
    settings.searchParams.set("hubspot", "unconfigured");
    return NextResponse.redirect(settings);
  }
  return NextResponse.redirect(buildAuthUrl(cfg, signState(tenantId)));
}
