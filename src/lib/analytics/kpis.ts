// Split-test KPI analytics (BUILD_PLAN step 8) + dashboard overview + revenue ROI.
import { db } from "@/lib/db";
import { hasEnoughData } from "@/lib/experiments/assignment";

export interface CohortStats {
  leads: number;
  researched: number;
  costCents: number;
  replied: number;
  booked: number;
  replyRate: number;
  bookingRate: number;
  costPerResearchedCents: number;
  revenueCents: number;
  revenuePerLeadCents: number;
}

export interface KpiSummary {
  treatment: CohortStats;
  control: CohortStats;
  replyLift: number;
  bookingLift: number;
  revenueLiftPerLeadCents: number;
  researchCostPerLeadCents: number;
  netRoiPerLeadCents: number;
  enoughData: boolean;
}

export interface LeadRow {
  cohort: "treatment" | "control" | null;
  status: string;
  researchCostCents: number;
  revenueCents: number;
  hasReply: boolean;
}

function cohortStats(rows: LeadRow[]): CohortStats {
  const leads = rows.length;
  const researched = rows.filter((r) => r.researchCostCents > 0).length;
  const costCents = rows.reduce((s, r) => s + r.researchCostCents, 0);
  const replied = rows.filter((r) => r.hasReply || r.status === "replied" || r.status === "booked").length;
  const booked = rows.filter((r) => r.status === "booked").length;
  const revenueCents = rows.reduce((s, r) => s + r.revenueCents, 0);
  return {
    leads,
    researched,
    costCents,
    replied,
    booked,
    replyRate: leads ? replied / leads : 0,
    bookingRate: leads ? booked / leads : 0,
    costPerResearchedCents: researched ? Math.round(costCents / researched) : 0,
    revenueCents,
    revenuePerLeadCents: leads ? Math.round(revenueCents / leads) : 0,
  };
}

export function computeKpis(rows: LeadRow[]): KpiSummary {
  const treatment = cohortStats(rows.filter((r) => r.cohort === "treatment"));
  const control = cohortStats(rows.filter((r) => r.cohort === "control"));
  const revenueLiftPerLeadCents = treatment.revenuePerLeadCents - control.revenuePerLeadCents;
  const researchCostPerLeadCents = treatment.leads ? Math.round(treatment.costCents / treatment.leads) : 0;
  return {
    treatment,
    control,
    replyLift: treatment.replyRate - control.replyRate,
    bookingLift: treatment.bookingRate - control.bookingRate,
    revenueLiftPerLeadCents,
    researchCostPerLeadCents,
    netRoiPerLeadCents: revenueLiftPerLeadCents - researchCostPerLeadCents,
    enoughData: hasEnoughData(treatment.leads, control.leads),
  };
}

export async function getDashboardKpis(tenantId: string): Promise<KpiSummary> {
  const leads = await db.lead.findMany({
    where: { tenantId },
    select: { id: true, researchCohort: true, status: true, researchCostCents: true, revenueCents: true },
  });
  const inbound = await db.outreachEvent.findMany({
    where: { direction: "inbound", lead: { tenantId } },
    select: { leadId: true },
    distinct: ["leadId"],
  });
  const repliedSet = new Set(inbound.map((e) => e.leadId));
  const rows: LeadRow[] = leads.map((l) => ({
    cohort: (l.researchCohort as "treatment" | "control" | null) ?? null,
    status: l.status,
    researchCostCents: l.researchCostCents,
    revenueCents: l.revenueCents,
    hasReply: repliedSet.has(l.id),
  }));
  return computeKpis(rows);
}

// ---- Dashboard overview ----

export interface Overview {
  imported: number;
  eligible: number;
  revived: number;
  booked: number;
  replies: number;
  bookingLiftPts: number;
  costPerRevivedCents: number;
  consentBlocked: number;
  totalRevenueCents: number;
}
export interface ComplianceStats {
  smsReady: number;
  missingEmail: number;
  optedOut: number;
}
export interface RecentLead {
  name: string;
  company: string;
  status: string;
  tone: "green" | "gold" | "rust" | "none";
}
export interface DashboardData {
  overview: Overview;
  experiment: KpiSummary;
  compliance: ComplianceStats;
  recent: RecentLead[];
}

export async function getDashboardData(tenantId: string): Promise<DashboardData> {
  const leads = await db.lead.findMany({
    where: { tenantId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      company: true,
      researchCohort: true,
      status: true,
      researchCostCents: true,
      revenueCents: true,
      smsConsent: true,
      emailConsent: true,
      optedOut: true,
      createdAt: true,
    },
  });
  const inbound = await db.outreachEvent.findMany({
    where: { direction: "inbound", lead: { tenantId } },
    select: { leadId: true },
    distinct: ["leadId"],
  });
  const replied = new Set(inbound.map((e) => e.leadId));
  type Raw = (typeof leads)[number];

  const rows: LeadRow[] = leads.map((l) => ({
    cohort: (l.researchCohort as "treatment" | "control" | null) ?? null,
    status: l.status,
    researchCostCents: l.researchCostCents,
    revenueCents: l.revenueCents,
    hasReply: replied.has(l.id),
  }));
  const experiment = computeKpis(rows);

  const isRevived = (l: Raw) => replied.has(l.id) || ["replied", "booked", "engaged"].includes(l.status);
  const revived = leads.filter(isRevived).length;
  const totalCost = leads.reduce((s, l) => s + l.researchCostCents, 0);

  const overview: Overview = {
    imported: leads.length,
    eligible: leads.filter((l) => (l.smsConsent || l.emailConsent) && !l.optedOut).length,
    revived,
    booked: leads.filter((l) => l.status === "booked").length,
    replies: leads.filter((l) => replied.has(l.id)).length,
    bookingLiftPts: Math.round(experiment.bookingLift * 1000) / 10,
    costPerRevivedCents: revived ? Math.round(totalCost / revived) : 0,
    consentBlocked: leads.filter((l) => l.optedOut || (!l.smsConsent && !l.emailConsent)).length,
    totalRevenueCents: leads.reduce((s, l) => s + l.revenueCents, 0),
  };

  const compliance: ComplianceStats = {
    smsReady: leads.filter((l) => l.smsConsent && !l.optedOut).length,
    missingEmail: leads.filter((l) => !l.emailConsent).length,
    optedOut: leads.filter((l) => l.optedOut).length,
  };

  const recent: RecentLead[] = [...leads]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map((l) => {
      const name = [l.firstName, l.lastName].filter(Boolean).join(" ") || l.company || "Lead";
      let status = "New";
      let tone: RecentLead["tone"] = "none";
      if (l.optedOut) {
        status = "Opted out";
        tone = "rust";
      } else if (isRevived(l)) {
        status = "Revived";
        tone = "green";
      } else if (l.smsConsent || l.emailConsent) {
        status = "Consented";
        tone = "gold";
      }
      return { name, company: l.company || "—", status, tone };
    });

  return { overview, experiment, compliance, recent };
}
