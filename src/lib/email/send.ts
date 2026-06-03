// Email send. Two paths:
//  - platform (SendGrid-compatible API), used for "internal" send mode
//  - SMTP via nodemailer, used for "backoffice" (the tenant's own mail server)
// One-click unsubscribe (CAN-SPAM): footer link + List-Unsubscribe header.
import nodemailer from "nodemailer";
import { ChannelNotConfiguredError } from "@/lib/send/errors";
import { getSetting } from "@/lib/settings/platform";

function footer(unsubscribeUrl?: string): string {
  return unsubscribeUrl ? `\n\n—\nUnsubscribe: ${unsubscribeUrl}` : "";
}

export async function sendEmail(args: { to: string; subject: string; body: string; unsubscribeUrl?: string }): Promise<void> {
  const apiKey = await getSetting("EMAIL_PROVIDER_API_KEY");
  const from = await getSetting("EMAIL_FROM");
  if (!apiKey || !from) throw new ChannelNotConfiguredError("email");

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: args.to }] }],
      from: { email: from },
      subject: args.subject,
      content: [{ type: "text/plain", value: args.body + footer(args.unsubscribeUrl) }],
      ...(args.unsubscribeUrl ? { headers: { "List-Unsubscribe": `<${args.unsubscribeUrl}>` } } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Email send failed (${res.status}): ${await res.text()}`);
}

export async function smtpSendEmail(args: {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  unsubscribeUrl?: string;
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: args.host,
    port: args.port,
    secure: args.port === 465,
    auth: { user: args.user, pass: args.pass },
  });
  await transporter.sendMail({
    from: args.from,
    to: args.to,
    subject: args.subject,
    text: args.body + footer(args.unsubscribeUrl),
    headers: args.unsubscribeUrl ? { "List-Unsubscribe": `<${args.unsubscribeUrl}>` } : undefined,
  });
}
