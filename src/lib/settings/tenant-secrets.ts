// Per-tenant encrypted sending secrets (their own gateway credentials).
// Same AES-256-GCM box as platform settings; values are never returned to the UI.
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secretbox";

export const TENANT_SECRET_KEYS = ["TWILIO_AUTH_TOKEN", "SMTP_PASS"] as const;
export type TenantSecretKey = (typeof TENANT_SECRET_KEYS)[number];

export async function getTenantSecret(tenantId: string, key: string): Promise<string | undefined> {
  const row = await db.tenantSecret.findUnique({ where: { tenantId_key: { tenantId, key } } });
  if (!row?.value) return undefined;
  try {
    return decryptSecret(row.value);
  } catch {
    return undefined;
  }
}

export async function setTenantSecret(tenantId: string, key: string, plaintext: string): Promise<void> {
  const value = encryptSecret(plaintext);
  await db.tenantSecret.upsert({
    where: { tenantId_key: { tenantId, key } },
    update: { value },
    create: { tenantId, key, value },
  });
}

/** Set/not-set status per secret key (never the values). */
export async function tenantSecretStatus(tenantId: string): Promise<Record<TenantSecretKey, boolean>> {
  const rows = await db.tenantSecret.findMany({ where: { tenantId }, select: { key: true } });
  const set = new Set(rows.map((r) => r.key));
  return Object.fromEntries(TENANT_SECRET_KEYS.map((k) => [k, set.has(k)])) as Record<TenantSecretKey, boolean>;
}
