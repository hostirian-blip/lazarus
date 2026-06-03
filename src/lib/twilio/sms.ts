// Twilio SMS. Use a per-tenant Messaging Service (10DLC-registered).
// Enforce consent + opt-out (STOP/HELP) BEFORE sending.
// TODO(claude-code): implement send + inbound webhook (/api/webhooks/twilio).
export async function sendSms(_args: { to: string; body: string; messagingServiceSid: string }): Promise<void> {
  throw new Error("not implemented: sendSms");
}
