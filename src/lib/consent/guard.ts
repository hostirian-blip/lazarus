// Central consent gate. Every outbound message MUST pass through this.
import type { Lead } from "@prisma/client";

export function canContact(lead: Lead, channel: "sms" | "email"): { ok: boolean; reason?: string } {
  if (lead.optedOut) return { ok: false, reason: "opted_out" };
  if (channel === "sms" && !lead.smsConsent) return { ok: false, reason: "no_sms_consent" };
  if (channel === "email" && !lead.emailConsent) return { ok: false, reason: "no_email_consent" };
  return { ok: true };
}
