// GET /api/connectors/hubspot/callback — OAuth redirect target. Verifies the
// signed state, exchanges the code for tokens, and stores them on the tenant.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getHubSpotConfig, verifyState, exchangeCodeForTokens } from "@/lib/connectors/hubspot-oauth";
import { encToken } from "@/lib/connectors/token-crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dash = new URL("/dashboard", url.origin);

  if (url.searchParams.get("error")) {
    dash.searchParams.set("hubspot", "denied");
    return NextResponse.redirect(dash);
  }

  const code = url.searchParams.get("code");
  const verified = verifyState(url.searchParams.get("state") ?? "");
  const cfg = await getHubSpotConfig();
  if (!code || !verified || !cfg) {
    dash.searchParams.set("hubspot", "error");
    return NextResponse.redirect(dash);
  }

  try {
    const tokens = await exchangeCodeForTokens(cfg, code);
    const access = encToken(tokens.accessToken);
    const refresh = encToken(tokens.refreshToken);
    await db.crmConnection.upsert({
      where: { tenantId: verified.tenantId },
      update: {
        provider: "hubspot",
        accessToken: access,
        refreshToken: refresh,
        expiresAt: tokens.expiresAt,
      },
      create: {
        tenantId: verified.tenantId,
        provider: "hubspot",
        accessToken: access,
        refreshToken: refresh,
        expiresAt: tokens.expiresAt,
      },
    });
    dash.searchParams.set("hubspot", "connected");
  } catch {
    dash.searchParams.set("hubspot", "error");
  }
  return NextResponse.redirect(dash);
}
