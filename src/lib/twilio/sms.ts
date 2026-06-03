// Low-level Twilio SMS send. Credentials are passed in by the transport layer
// (platform creds for "internal" mode, the tenant's own for "backoffice").
import { ChannelNotConfiguredError } from "@/lib/send/errors";

export interface TwilioCreds {
  accountSid?: string;
  authToken?: string;
  messagingServiceSid?: string;
}

export async function twilioSendSms(creds: TwilioCreds, to: string, body: string): Promise<{ sid: string }> {
  const { accountSid, authToken, messagingServiceSid } = creds;
  if (!accountSid || !authToken || !messagingServiceSid) throw new ChannelNotConfiguredError("sms");

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, Body: body, MessagingServiceSid: messagingServiceSid }),
  });
  if (!res.ok) throw new Error(`Twilio send failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as { sid: string };
  return { sid: json.sid };
}
