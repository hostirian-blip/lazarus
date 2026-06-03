// Signed one-click unsubscribe tokens (CAN-SPAM). An HMAC over the lead id with
// the app secret lets a recipient opt out via a plain link (no auth), while
// preventing anyone from opting out an arbitrary lead by guessing ids.
import { createHmac, timingSafeEqual } from "crypto";

function secret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new Error("NEXTAUTH_SECRET is required to sign unsubscribe tokens");
  return s;
}

export function unsubscribeToken(leadId: string): string {
  return createHmac("sha256", secret()).update(leadId).digest("hex");
}

export function verifyUnsubscribeToken(leadId: string, token: string): boolean {
  if (!leadId || !token) return false;
  const expected = Buffer.from(unsubscribeToken(leadId));
  const got = Buffer.from(token);
  if (expected.length !== got.length) return false;
  return timingSafeEqual(expected, got);
}

/** Absolute unsubscribe URL to embed in outbound emails. */
export function unsubscribeUrl(baseUrl: string, leadId: string): string {
  const u = new URL("/api/unsubscribe", baseUrl);
  u.searchParams.set("lead", leadId);
  u.searchParams.set("t", unsubscribeToken(leadId));
  return u.toString();
}
