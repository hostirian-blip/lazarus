// GoHighLevel (HighLevel / LeadConnector) OAuth 2.0 — authorization-code flow.
// Client id/secret come from a Marketplace app, resolved from platform settings.
// Tokens are location-scoped: the token response carries the `locationId`.
import { getSetting } from "@/lib/settings/platform";

export { signState, verifyState } from "./oauth-state";

const TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const AUTHORIZE_URL = "https://marketplace.gohighlevel.com/oauth/chooselocation";

export interface GhlConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

/** Read GoHighLevel OAuth config. Returns null if client id/secret are unset. */
export async function getGhlConfig(): Promise<GhlConfig | null> {
  const clientId = await getSetting("GOHIGHLEVEL_CLIENT_ID");
  const clientSecret = await getSetting("GOHIGHLEVEL_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = (await getSetting("GOHIGHLEVEL_REDIRECT_URI")) ?? `${base}/api/connectors/gohighlevel/callback`;
  const scopes = (await getSetting("GOHIGHLEVEL_SCOPES")) ?? "contacts.readonly contacts.write";
  return { clientId, clientSecret, redirectUri, scopes };
}

export function buildGhlAuthUrl(cfg: GhlConfig, state: string): string {
  const u = new URL(AUTHORIZE_URL);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("scope", cfg.scopes);
  u.searchParams.set("state", state);
  return u.toString();
}

export interface GhlTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  locationId?: string;
}

async function tokenRequest(body: Record<string, string>): Promise<GhlTokens> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`GoHighLevel token request failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    locationId?: string;
  };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    // GHL access tokens last ~24h; default defensively if expires_in is absent.
    expiresAt: new Date(Date.now() + (json.expires_in ?? 86_399) * 1000),
    locationId: json.locationId,
  };
}

export function exchangeGhlCode(cfg: GhlConfig, code: string): Promise<GhlTokens> {
  return tokenRequest({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri,
    user_type: "Location",
  });
}

export function refreshGhlToken(cfg: GhlConfig, refreshToken: string): Promise<GhlTokens> {
  return tokenRequest({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    user_type: "Location",
  });
}
