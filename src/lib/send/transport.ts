// Send routing by mode: "internal" uses the platform gateway (admin settings);
// "backoffice" uses the tenant's own Twilio + SMTP (per-tenant config/secrets).
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings/platform";
import { getTenantSecret } from "@/lib/settings/tenant-secrets";
import { twilioSendSms } from "@/lib/twilio/sms";
import { sendEmail as platformSendEmail, smtpSendEmail } from "@/lib/email/send";
import { ChannelNotConfiguredError } from "./errors";

export type SendMode = "internal" | "backoffice";

export async function sendMessage(opts: {
  tenantId: string;
  sendMode: SendMode;
  channel: "sms" | "email";
  to: string;
  body: string;
  subject?: string;
  unsubscribeUrl?: string;
}): Promise<void> {
  const { tenantId, sendMode, channel, to, body, subject, unsubscribeUrl } = opts;
  const tenant = await db.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) throw new Error("tenant not found");

  if (channel === "sms") {
    if (sendMode === "backoffice") {
      await twilioSendSms(
        {
          accountSid: tenant.twilioAccountSid ?? undefined,
          authToken: (await getTenantSecret(tenantId, "TWILIO_AUTH_TOKEN")) ?? undefined,
          messagingServiceSid: tenant.twilioNumber ?? undefined,
        },
        to,
        body,
      );
    } else {
      await twilioSendSms(
        {
          accountSid: await getSetting("TWILIO_ACCOUNT_SID"),
          authToken: await getSetting("TWILIO_AUTH_TOKEN"),
          messagingServiceSid: (await getSetting("TWILIO_MESSAGING_SERVICE_SID")) ?? tenant.twilioNumber ?? undefined,
        },
        to,
        body,
      );
    }
    return;
  }

  // email
  if (sendMode === "backoffice") {
    const pass = await getTenantSecret(tenantId, "SMTP_PASS");
    if (!tenant.smtpHost || !tenant.smtpPort || !tenant.smtpUser || !pass || !tenant.emailSender) {
      throw new ChannelNotConfiguredError("email");
    }
    await smtpSendEmail({
      host: tenant.smtpHost,
      port: tenant.smtpPort,
      user: tenant.smtpUser,
      pass,
      from: tenant.emailSender,
      to,
      subject: subject ?? "Following up",
      body,
      unsubscribeUrl,
    });
  } else {
    await platformSendEmail({ to, subject: subject ?? "Following up", body, unsubscribeUrl });
  }
}
