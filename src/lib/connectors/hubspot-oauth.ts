// HubSpot OAuth config + helpers (BUILD_PLAN step 3). Tokens are exchanged here;
// stored per-tenant in CrmConnection (see ./index.ts). The OAuth `state` is HMAC-
// signed and carries the tenantId so the callback can attribute the connection.
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

export interface HubSpotConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string;
}

/** Read HubSpot OAuth config from env. Returns null if client id/secret are unset. */
export function getHubSpotConfig(): HubSpotConfig | null {
  const clientId = process.env.HUBSPOT_CLIENT_ID;
  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const redirectUri = process.env.HUBSPOT_REDIRECT_URI ?? `${base}/api/connectors/hubspot/callback`;
  const scopes = process.env.HUBSPOT_SCOPES ?? "oauth crm.objects.contacts.read crm.objects.contacts.write";
  return { clientId, clientSecret, redirectUri, scopes };
}

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign OAuth state");
  return s;
}

export function signState(tenantId: string): string {
  const payload = Buffer.from(
    JSON.stringify({ t: tenantId, n: randomBytes(8).toString("hex") }),
  ).toString("base64url");
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifyState(state: string): { tenantId: string } | null {
  const [payload, sig] = (state ?? "").split(".");
  if (!payload || !sig) return null;
  const expected = createHmac("sha256", secret()).update(payload).digest("base64url");
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const obj = JSON.parse(Buffer.from(payload, "base64url").toString()) as { t?: unknown };
    return typeof obj.t === "string" ? { tenantId: obj.t } : null;
  } catch {
    return null;
  }
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
