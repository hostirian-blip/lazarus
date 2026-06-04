// GET /api/connectors/gohighlevel/callback — OAuth redirect target. Verifies the
// signed state, exchanges the code for tokens, and stores them (encrypted) on the tenant.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getGhlConfig, verifyState, exchangeGhlCode } from "@/lib/connectors/gohighlevel-oauth";
import { encToken } from "@/lib/connectors/token-crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dash = new URL("/dashboard", url.origin);

  if (url.searchParams.get("error")) {
    dash.searchParams.set("gohighlevel", "denied");
    return NextResponse.redirect(dash);
  }

  const code = url.searchParams.get("code");
  const verified = verifyState(url.searchParams.get("state") ?? "");
  const cfg = await getGhlConfig();
  if (!code || !verified || !cfg) {
    dash.searchParams.set("gohighlevel", "error");
    return NextResponse.redirect(dash);
  }

  try {
    const tokens = await exchangeGhlCode(cfg, code);
    const access = encToken(tokens.accessToken);
    const refresh = encToken(tokens.refreshToken);
    await db.crmConnection.upsert({
      where: { tenantId_provider: { tenantId: verified.tenantId, provider: "gohighlevel" } },
      update: {
        accessToken: access,
        refreshToken: refresh,
        expiresAt: tokens.expiresAt,
        locationId: tokens.locationId ?? null,
      },
      create: {
        tenantId: verified.tenantId,
        provider: "gohighlevel",
        accessToken: access,
        refreshToken: refresh,
        expiresAt: tokens.expiresAt,
        locationId: tokens.locationId ?? null,
      },
    });
    dash.searchParams.set("gohighlevel", "connected");
  } catch {
    dash.searchParams.set("gohighlevel", "error");
  }
  return NextResponse.redirect(dash);
}
