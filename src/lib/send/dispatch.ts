// Outbound dispatch (BUILD_PLAN step 7). EVERY send passes the consent gate
// FIRST (non-negotiable). Then drafts via the re-nurture agent, sends on the
// channel, and logs an OutreachEvent. Channel sends are gated by provider creds.
import type { Lead, Tenant } from "@prisma/client";
import { db } from "@/lib/db";
import type { TenantDb } from "@/lib/tenant";
import { canContact } from "@/lib/consent/guard";
import { draftMessage } from "@/lib/agents/renurture";
import type { ResearchBrief } from "@/lib/agents/research";
import { sendSms } from "@/lib/twilio/sms";
import { sendEmail } from "@/lib/email/send";
import { ChannelNotConfiguredError } from "@/lib/send/errors";
import { unsubscribeUrl } from "@/lib/consent/unsubscribe";

export interface DispatchResult {
  sent: boolean;
  reason: string;
}

export async function dispatchToLead(opts: {
  scoped: TenantDb;
  tenant: Tenant;
  lead: Lead;
  channel: "sms" | "email";
}): Promise<DispatchResult> {
  const { scoped, tenant, lead, channel } = opts;

  // 1) Consent gate — the one every message must pass.
  const gate = canContact(lead, channel);
  if (!gate.ok) return { sent: false, reason: gate.reason ?? "blocked" };

  // 2) Draft (personalized from the research brief when present + confident).
  const brief = (lead.researchBrief as unknown as ResearchBrief | null) ?? undefined;
  const draft = await draftMessage({
    lead: {
      crmId: lead.crmId ?? "",
      firstName: lead.firstName ?? undefined,
      lastName: lead.lastName ?? undefined,
      email: lead.email ?? undefined,
      phone: lead.phoneE164 ?? undefined,
      company: lead.company ?? undefined,
    },
    channel,
    brief,
    brandVoice: tenant.name,
  });

  // 3) Send (gated by channel credentials).
  try {
    if (channel === "sms") {
      if (!lead.phoneE164) return { sent: false, reason: "no_phone" };
      await sendSms({ to: lead.phoneE164, body: draft.body, messagingServiceSid: tenant.twilioNumber ?? "" });
    } else {
      if (!lead.email) return { sent: false, reason: "no_email" };
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      await sendEmail({
        to: lead.email,
        subject: draft.subject ?? "Following up",
        body: draft.body,
        unsubscribeUrl: unsubscribeUrl(base, lead.id),
      });
    }
  } catch (e) {
    if (e instanceof ChannelNotConfiguredError) return { sent: false, reason: "channel_not_configured" };
    return { sent: false, reason: "send_error" };
  }

  // 4) Log the outbound message + advance lead status.
  await db.outreachEvent.create({
    data: {
      leadId: lead.id,
      channel,
      direction: "outbound",
      body: draft.subject ? `${draft.subject}\n\n${draft.body}` : draft.body,
    },
  });
  await scoped.lead.updateMany({ where: { id: lead.id }, data: { status: "engaged" } });

  return { sent: true, reason: "ok" };
}
