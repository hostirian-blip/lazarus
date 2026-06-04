// Connector resolution: load a tenant's connected CRM (by provider) as a
// CrmConnector, transparently refreshing the OAuth token when it's near expiry.
import { db } from "@/lib/db";
import type { CrmConnector } from "./types";
import { HubSpotConnector } from "./hubspot";
import { GoHighLevelConnector } from "./gohighlevel";
import { getHubSpotConfig, refreshAccessToken } from "./hubspot-oauth";
import { getGhlConfig, refreshGhlToken } from "./gohighlevel-oauth";
import { encToken, decToken } from "./token-crypto";

export const CRM_PROVIDERS = ["hubspot", "gohighlevel"] as const;
export type CrmProvider = (typeof CRM_PROVIDERS)[number];

interface Refreshed {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

async function refreshFor(provider: string, refreshToken: string): Promise<Refreshed | null> {
  if (provider === "hubspot") {
    const cfg = await getHubSpotConfig();
    return cfg ? refreshAccessToken(cfg, refreshToken) : null;
  }
  if (provider === "gohighlevel") {
    const cfg = await getGhlConfig();
    return cfg ? refreshGhlToken(cfg, refreshToken) : null;
  }
  return null;
}

export async function getTenantConnector(tenantId: string, provider: string): Promise<CrmConnector | null> {
  const conn = await db.crmConnection.findUnique({ where: { tenantId_provider: { tenantId, provider } } });
  if (!conn) return null;

  let accessToken = decToken(conn.accessToken);
  const nearExpiry = conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 60_000;
  if (nearExpiry && conn.refreshToken) {
    const t = await refreshFor(provider, decToken(conn.refreshToken));
    if (t) {
      await db.crmConnection.update({
        where: { tenantId_provider: { tenantId, provider } },
        data: { accessToken: encToken(t.accessToken), refreshToken: encToken(t.refreshToken), expiresAt: t.expiresAt },
      });
      accessToken = t.accessToken;
    }
  }

  if (provider === "hubspot") return new HubSpotConnector(accessToken);
  if (provider === "gohighlevel") return new GoHighLevelConnector(accessToken, conn.locationId ?? "");
  return null;
}
