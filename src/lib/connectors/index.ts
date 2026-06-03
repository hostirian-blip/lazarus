// Connector resolution: load a tenant's connected CRM as a CrmConnector,
// transparently refreshing the OAuth token when it's near expiry.
import { db } from "@/lib/db";
import type { CrmConnector } from "./types";
import { HubSpotConnector } from "./hubspot";
import { getHubSpotConfig, refreshAccessToken } from "./hubspot-oauth";

export async function getTenantConnector(tenantId: string): Promise<CrmConnector | null> {
  const conn = await db.crmConnection.findUnique({ where: { tenantId } });
  if (!conn || conn.provider !== "hubspot") return null;

  let accessToken = conn.accessToken;
  const nearExpiry = conn.expiresAt && conn.expiresAt.getTime() < Date.now() + 60_000;
  if (nearExpiry && conn.refreshToken) {
    const cfg = await getHubSpotConfig();
    if (cfg) {
      const t = await refreshAccessToken(cfg, conn.refreshToken);
      await db.crmConnection.update({
        where: { tenantId },
        data: { accessToken: t.accessToken, refreshToken: t.refreshToken, expiresAt: t.expiresAt },
      });
      accessToken = t.accessToken;
    }
  }
  return new HubSpotConnector(accessToken);
}
