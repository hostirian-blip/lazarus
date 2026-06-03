// Central consent gate (BUILD_PLAN step 4). Every outbound message MUST pass
// canContact() before sending. This module also classifies inbound keywords
// (STOP/HELP/START) so the webhook can honor opt-out (TCPA/CAN-SPAM). DB writes
// live in the webhook/unsubscribe routes — this file stays pure/testable.
import type { Lead } from "@prisma/client";

export function canContact(lead: Lead, channel: "sms" | "email"): { ok: boolean; reason?: string } {
  if (lead.optedOut) return { ok: false, reason: "opted_out" };
  if (channel === "sms" && !lead.smsConsent) return { ok: false, reason: "no_sms_consent" };
  if (channel === "email" && !lead.emailConsent) return { ok: false, reason: "no_email_consent" };
  return { ok: true };
}

// Carrier-recognized opt-out / opt-in / help keywords (compared lowercased+trimmed).
export const STOP_KEYWORDS = new Set([
  "stop", "stopall", "stop all", "unsubscribe", "cancel", "end", "quit", "optout", "opt out",
]);
export const START_KEYWORDS = new Set(["start", "unstop", "yes", "optin", "opt in"]);
export const HELP_KEYWORDS = new Set(["help", "info"]);

export type InboundIntent = "stop" | "start" | "help" | "message";

/** Classify an inbound SMS body into a consent intent. */
export function classifyInbound(body: string): InboundIntent {
  const t = (body ?? "").trim().toLowerCase();
  if (STOP_KEYWORDS.has(t)) return "stop";
  if (START_KEYWORDS.has(t)) return "start";
  if (HELP_KEYWORDS.has(t)) return "help";
  return "message";
}
