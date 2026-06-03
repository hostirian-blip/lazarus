// Outbound dispatch (one-off). EVERY send passes the consent gate first, then
// drafts via the re-nurture agent and sends through the chosen transport mode.
import type { Lead, Tenant } from "@prisma/client";
import { db } from "@/lib/db";
import type { TenantDb } from "@/lib/tenant";
import { canContact } from "@/lib/consent/guard";
import { draftMessage } from "@/lib/agents/renurture";
import type { ResearchBrief } from "@/lib/agents/research";
import { ChannelNotConfiguredError } from "@/lib/send/errors";
import { unsubscribeUrl } from "@/lib/consent/unsubscribe";
import { sendMessage, type SendMode } from "@/lib/send/transport";

export interface DispatchResult {
  sent: boolean;
  reason: string;
}

export async function dispatchToLead(opts: {
  scoped: TenantDb;
  tenant: Tenant;
  lead: Lead;
  channel: "sms" | "email";
  sendMode?: SendMode;
}): Promise<DispatchResult> {
  const { scoped, tenant, lead, channel } = opts;
  const sendMode: SendMode = opts.sendMode ?? "internal";

  // 1) Consent gate — the one every message must pass.
  const gate = canContact(lead, channel);
  if (!gate.ok) return { sent: false, reason: gate.reason ?? "blocked" };

  // 2) Draft.
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
    brandVoice: tenant.brandVoice || tenant.name,
  });

  // 3) Send via the chosen transport.
  try {
    if (channel === "sms") {
      if (!lead.phoneE164) return { sent: false, reason: "no_phone" };
      await sendMessage({ tenantId: tenant.id, sendMode, channel: "sms", to: lead.phoneE164, body: draft.body });
    } else {
      if (!lead.email) return { sent: false, reason: "no_email" };
      const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
      await sendMessage({ tenantId: tenant.id, sendMode, channel: "email", to: lead.email, subject: draft.subject ?? "Following up", body: draft.body, unsubscribeUrl: unsubscribeUrl(base, lead.id) });
    }
  } catch (e) {
    if (e instanceof ChannelNotConfiguredError) return { sent: false, reason: "channel_not_configured" };
    return { sent: false, reason: "send_error" };
  }

  // 4) Log + advance status.
  await db.outreachEvent.create({
    data: { leadId: lead.id, channel, direction: "outbound", body: draft.subject ? `${draft.subject}\n\n${draft.body}` : draft.body },
  });
  await scoped.lead.updateMany({ where: { id: lead.id }, data: { status: "engaged" } });
  return { sent: true, reason: "ok" };
}
