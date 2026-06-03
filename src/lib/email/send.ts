// Email send via a SendGrid-compatible provider API. Includes a one-click
// unsubscribe (CAN-SPAM): footer link + List-Unsubscribe header.
// Gated by EMAIL_PROVIDER_API_KEY + EMAIL_FROM.
import { ChannelNotConfiguredError } from "@/lib/send/errors";

export function emailConfigured(): boolean {
  return Boolean(process.env.EMAIL_PROVIDER_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(args: {
  to: string;
  subject: string;
  body: string;
  unsubscribeUrl?: string;
}): Promise<void> {
  const apiKey = process.env.EMAIL_PROVIDER_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new ChannelNotConfiguredError("email");

  const footer = args.unsubscribeUrl ? `\n\n—\nUnsubscribe: ${args.unsubscribeUrl}` : "";
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: args.to }] }],
      from: { email: from },
      subject: args.subject,
      content: [{ type: "text/plain", value: args.body + footer }],
      ...(args.unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${args.unsubscribeUrl}>` } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
}
