// Twilio SMS via a per-tenant Messaging Service (10DLC-registered).
// Consent + opt-out are enforced UPSTREAM in the dispatcher (canContact); this
// module only sends. Gated by TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN.
import { ChannelNotConfiguredError } from "@/lib/send/errors";

export function smsConfigured(): boolean {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
}

export async function sendSms(args: { to: string; body: string; messagingServiceSid: string }): Promise<{ sid: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) throw new ChannelNotConfiguredError("sms");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      To: args.to,
      Body: args.body,
      MessagingServiceSid: args.messagingServiceSid,
    }),
  });
  if (!res.ok) throw new Error(`Twilio send failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { sid: string };
  return { sid: json.sid };
}
