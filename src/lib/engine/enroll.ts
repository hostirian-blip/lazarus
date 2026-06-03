// Enroll eligible leads into a campaign (launch). One enrollment per lead/campaign.
import { db } from "@/lib/db";

export interface EnrollResult {
  candidates: number;
  enrolled: number;
  alreadyEnrolled: number;
}

export async function enrollLeadsInCampaign(tenantId: string, campaignId: string): Promise<EnrollResult> {
  const campaign = await db.campaign.findFirst({ where: { id: campaignId, tenantId } });
  if (!campaign) throw new Error("Campaign not found");

  const steps = Array.isArray(campaign.sequence) ? (campaign.sequence as unknown as { delayHours?: number }[]) : [];
  const firstDelayMs = Math.max(0, Number(steps[0]?.delayHours ?? 0)) * 3600_000;
  const now = new Date();

  // Eligible = consented on at least one channel, not opted out, not already closed.
  const leads = await db.lead.findMany({
    where: { tenantId, optedOut: false, status: { notIn: ["booked", "dead"] }, OR: [{ smsConsent: true }, { emailConsent: true }] },
    select: { id: true },
  });

  const res: EnrollResult = { candidates: leads.length, enrolled: 0, alreadyEnrolled: 0 };
  for (const l of leads) {
    try {
      await db.enrollment.create({
        data: { tenantId, leadId: l.id, campaignId, step: 0, status: "active", nextRunAt: new Date(now.getTime() + firstDelayMs) },
      });
      res.enrolled++;
    } catch {
      res.alreadyEnrolled++; // unique [leadId, campaignId]
    }
  }
  return res;
}
