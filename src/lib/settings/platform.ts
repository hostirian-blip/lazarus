// Platform-level settings (integration credentials). Stored encrypted in the
// Setting table; read with a DB-then-env fallback. Plaintext values are NEVER
// returned to the UI — only set/not-set status (see getSettingsStatus).
import { db } from "@/lib/db";
import { encryptSecret, decryptSecret } from "@/lib/crypto/secretbox";

export interface PlatformKeyDef {
  key: string;
  label: string;
  secret: boolean; // true => value is sensitive (never shown back)
  help?: string;
}

export const PLATFORM_KEYS: PlatformKeyDef[] = [
  { key: "ANTHROPIC_API_KEY", label: "Anthropic API key", secret: true, help: "Research + re-nurture agents" },
  { key: "ANTHROPIC_MODEL", label: "Anthropic model", secret: false, help: "default: claude-3-5-haiku-latest" },
  { key: "HUBSPOT_CLIENT_ID", label: "HubSpot client ID", secret: false, help: "Redirect: https://lazarus.vrroom.io/api/connectors/hubspot/callback" },
  { key: "HUBSPOT_CLIENT_SECRET", label: "HubSpot client secret", secret: true },
  { key: "GOHIGHLEVEL_CLIENT_ID", label: "GoHighLevel client ID", secret: false, help: "Redirect: https://lazarus.vrroom.io/api/connectors/gohighlevel/callback · scopes: contacts.readonly contacts.write" },
  { key: "GOHIGHLEVEL_CLIENT_SECRET", label: "GoHighLevel client secret", secret: true },
  { key: "TWILIO_ACCOUNT_SID", label: "Twilio Account SID", secret: false },
  { key: "TWILIO_AUTH_TOKEN", label: "Twilio Auth Token", secret: true },
  { key: "TWILIO_MESSAGING_SERVICE_SID", label: "Twilio Messaging Service SID", secret: false },
  { key: "EMAIL_PROVIDER_API_KEY", label: "Email provider API key", secret: true },
  { key: "EMAIL_FROM", label: "Email from-address", secret: false },
  { key: "EMAIL_WEBHOOK_SECRET", label: "Inbound email webhook secret", secret: true },
  { key: "STRIPE_SECRET_KEY", label: "Stripe secret key", secret: true },
  { key: "STRIPE_WEBHOOK_SECRET", label: "Stripe webhook secret", secret: true },
  { key: "STRIPE_PRICE_ID", label: "Stripe price ID (subscription)", secret: false },
];

const MANAGED = new Set(PLATFORM_KEYS.map((k) => k.key));

/** Resolve a setting: decrypted DB value if present, else env, else undefined. */
export async function getSetting(key: string): Promise<string | undefined> {
  const row = await db.setting.findUnique({ where: { key } });
  if (row?.value) {
    try {
      return decryptSecret(row.value);
    } catch {
      /* undecryptable (e.g. key rotated) — fall back to env */
    }
  }
  return process.env[key] ?? undefined;
}

export async function setSetting(key: string, plaintext: string): Promise<void> {
  if (!MANAGED.has(key)) throw new Error(`unknown setting: ${key}`);
  const value = encryptSecret(plaintext);
  await db.setting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function clearSetting(key: string): Promise<void> {
  await db.setting.deleteMany({ where: { key } });
}

export interface SettingStatus extends PlatformKeyDef {
  set: boolean;
  source: "db" | "env" | "none";
}

/** Status only — never the values. Powers the masked admin form. */
export async function getSettingsStatus(): Promise<SettingStatus[]> {
  const rows = await db.setting.findMany({ select: { key: true } });
  const dbKeys = new Set(rows.map((r) => r.key));
  return PLATFORM_KEYS.map((d) => {
    const inDb = dbKeys.has(d.key);
    const inEnv = Boolean(process.env[d.key]);
    return { ...d, set: inDb || inEnv, source: inDb ? "db" : inEnv ? "env" : "none" };
  });
}
