// The sequence engine. Each tick processes due enrollments: consent gate ->
// render step template (or re-nurture draft) -> send -> log -> advance by delay.
// Stops on opt-out / booking / sequence end. Channel-not-configured retries later.
import { db } from "@/lib/db";
import { tenantDb } from "@/lib/tenant";
import { canContact } from "@/lib/consent/guard";
import { sendMessage } from "@/lib/send/transport";
import { ChannelNotConfiguredError } from "@/lib/send/errors";
import { unsubscribeUrl } from "@/lib/consent/unsubscribe";
import { renderTemplate } from "./render";
import { draftMessage } from "@/lib/agents/renurture";
import type { ResearchBrief } from "@/lib/agents/research";

interface Step {
  channel: "sms" | "email";
  delayHours: number;
  body: string;
  subject?: string;
}

export interface TickResult {
  processed: number;
  sent: number;
  advanced: number;
  stopped: number;
  skipped: number;
  errors: number;
}

const HOUR = 3600_000;

async function advance(id: string, nextStep: number, steps: Step[], now: Date) {
  if (nextStep >= steps.length) {
    await db.enrollment.update({ where: { id }, data: { step: nextStep, status: "done" } });
  } else {
    const delayMs = Math.max(0, Number(steps[nextStep]?.delayHours ?? 0)) * HOUR;
    await db.enrollment.update({ where: { id }, data: { step: nextStep, nextRunAt: new Date(now.getTime() + delayMs) } });
  }
}

export async function runDueSends(limit = 100): Promise<TickResult> {
  const res: TickResult = { processed: 0, sent: 0, advanced: 0, stopped: 0, skipped: 0, errors: 0 };
  const now = new Date();
  const due = await db.enrollment.findMany({
    where: { status: "active", nextRunAt: { lte: now } },
    include: { lead: true, campaign: true },
    orderBy: { nextRunAt: "asc" },
    take: limit,
  });

  for (const e of due) {
    res.processed++;
    try {
      const steps = (Array.isArray(e.campaign.sequence) ? e.campaign.sequence : []) as unknown as Step[];
      const lead = e.lead;

      if (!e.campaign.active) {
        await db.enrollment.update({ where: { id: e.id }, data: { status: "stopped" } });
        res.stopped++;
        continue;
      }
      if (e.step >= steps.length) {
        await db.enrollment.update({ where: { id: e.id }, data: { status: "done" } });
        res.advanced++;
        continue;
      }
      if (lead.optedOut || lead.status === "booked") {
        await db.enrollment.update({ where: { id: e.id }, data: { status: "stopped" } });
        res.stopped++;
        continue;
      }

      const step = steps[e.step];

      // Consent gate — the one every message must pass. No consent on this channel: skip the step.
      if (!canContact(lead, step.channel).ok) {
        await advance(e.id, e.step + 1, steps, now);
        res.skipped++;
        continue;
      }

      // Compose: rendered template, or fall back to the re-nurture agent.
      let subject = step.subject;
      let bodyText = step.body ? renderTemplate(step.body, lead) : "";
      if (!bodyText) {
        const brief = (lead.researchBrief as unknown as ResearchBrief | null) ?? undefined;
        const tenant = await db.tenant.findUnique({ where: { id: e.tenantId }, select: { name: true, brandVoice: true } });
        const draft = await draftMessage({
          lead: { crmId: lead.crmId ?? "", firstName: lead.firstName ?? undefined, lastName: lead.lastName ?? undefined, email: lead.email ?? undefined, phone: lead.phoneE164 ?? undefined, company: lead.company ?? undefined },
          channel: step.channel,
          brief,
          brandVoice: tenant?.brandVoice || tenant?.name || "our team",
        });
        bodyText = draft.body;
        subject = subject ?? draft.subject;
      }

      // Send (gated by channel credentials).
      const sendMode = e.campaign.sendMode === "backoffice" ? "backoffice" : "internal";
      try {
        if (step.channel === "sms") {
          if (!lead.phoneE164) { await advance(e.id, e.step + 1, steps, now); res.skipped++; continue; }
          await sendMessage({ tenantId: e.tenantId, sendMode, channel: "sms", to: lead.phoneE164, body: bodyText });
        } else {
          if (!lead.email) { await advance(e.id, e.step + 1, steps, now); res.skipped++; continue; }
          const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
          await sendMessage({ tenantId: e.tenantId, sendMode, channel: "email", to: lead.email, subject, body: bodyText, unsubscribeUrl: unsubscribeUrl(base, lead.id) });
        }
      } catch (err) {
        if (err instanceof ChannelNotConfiguredError) {
          // Channel off (no creds yet): retry in 1h, don't advance — resumes once configured.
          await db.enrollment.update({ where: { id: e.id }, data: { nextRunAt: new Date(now.getTime() + HOUR) } });
          res.skipped++;
          continue;
        }
        throw err;
      }

      await db.outreachEvent.create({
        data: { leadId: lead.id, channel: step.channel, direction: "outbound", body: subject ? `${subject}\n\n${bodyText}` : bodyText, meta: { campaignId: e.campaignId, step: e.step } },
      });
      await tenantDb(e.tenantId).lead.updateMany({ where: { id: lead.id }, data: { status: "engaged" } });
      await advance(e.id, e.step + 1, steps, now);
      res.sent++;
      res.advanced++;
    } catch {
      res.errors++;
      // Back off a poison record so it can't hot-loop the worker.
      await db.enrollment.update({ where: { id: e.id }, data: { nextRunAt: new Date(now.getTime() + HOUR) } }).catch(() => {});
    }
  }
  return res;
}
