// Shared HMAC-signed OAuth `state` (carries tenantId through the redirect),
// used by every CRM connector (HubSpot, GoHighLevel, …).
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

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
