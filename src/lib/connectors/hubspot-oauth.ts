// HubSpot OAuth config + helpers (BUILD_PLAN step 3). Client id/secret resolve
// from platform settings (DB) or env. The OAuth `state` is HMAC-signed and
// carries the tenantId so the callback can attribute the connection.
import { getSetting } from "@/lib/settings/platform";

// State signing is shared across all CRM connectors.
export { signState, verifyState } from "./oauth-state";

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

/** Read HubSpot OAuth config. Returns null if client id/secret are unset. */
export async function getHubSpotConfig(): Promise<HubSpotConfig | null> {
  const clientId = await getSetting("HUBSPOT_CLIENT_ID");
  const clientSecret = await getSetting("HUBSPOT_CLIENT_SECRET");
  if (!clientId || !clientSecret) return null;
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = (await getSetting("HUBSPOT_REDIRECT_URI")) ?? `${base}/api/connectors/hubspot/callback`;
  const scopes = (await getSetting("HUBSPOT_SCOPES")) ?? "oauth crm.objects.contacts.read crm.objects.contacts.write";
  return { clientId, clientSecret, redirectUri, scopes };
}

export function buildAuthUrl(cfg: HubSpotConfig, state: string): string {
  const u = new URL("https://app.hubspot.com/oauth/authorize");
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("scope", cfg.scopes);
  u.searchParams.set("state", state);
  return u.toString();
}

export interface HubSpotTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

async function tokenRequest(body: Record<string, string>): Promise<HubSpotTokens> {
  const res = await fetch("https://api.hubapi.com/oauth/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body),
  });
  if (!res.ok) throw new Error(`HubSpot token request failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    expiresAt: new Date(Date.now() + json.expires_in * 1000),
  };
}

export function exchangeCodeForTokens(cfg: HubSpotConfig, code: string): Promise<HubSpotTokens> {
  return tokenRequest({
    grant_type: "authorization_code",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    redirect_uri: cfg.redirectUri,
    code,
  });
}

export function refreshAccessToken(cfg: HubSpotConfig, refreshToken: string): Promise<HubSpotTokens> {
  return tokenRequest({
    grant_type: "refresh_token",
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    refresh_token: refreshToken,
  });
}
