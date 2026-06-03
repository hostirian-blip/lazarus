// Split-test KPI analytics (BUILD_PLAN step 8). The payoff: prove research ROI so
// a client can confidently ramp rollout %. Per cohort we surface cost/researched
// lead, reply rate, booking rate; and the net lift (treatment vs control).
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
}

export interface KpiSummary {
  treatment: CohortStats;
  control: CohortStats;
  replyLift: number; // treatment.replyRate - control.replyRate
  bookingLift: number; // treatment.bookingRate - control.bookingRate
  enoughData: boolean;
}

export interface LeadRow {
  cohort: "treatment" | "control" | null;
  status: string;
  researchCostCents: number;
  hasReply: boolean;
}

function cohortStats(rows: LeadRow[]): CohortStats {
  const leads = rows.length;
  const researched = rows.filter((r) => r.researchCostCents > 0).length;
  const costCents = rows.reduce((s, r) => s + r.researchCostCents, 0);
  const replied = rows.filter((r) => r.hasReply || r.status === "replied" || r.status === "booked").length;
  const booked = rows.filter((r) => r.status === "booked").length;
  return {
    leads,
    researched,
    costCents,
    replied,
    booked,
    replyRate: leads ? replied / leads : 0,
    bookingRate: leads ? booked / leads : 0,
    costPerResearchedCents: researched ? Math.round(costCents / researched) : 0,
  };
}

/** Pure KPI computation over lead rows (testable). */
export function computeKpis(rows: LeadRow[]): KpiSummary {
  const treatment = cohortStats(rows.filter((r) => r.cohort === "treatment"));
  const control = cohortStats(rows.filter((r) => r.cohort === "control"));
  return {
    treatment,
    control,
    replyLift: treatment.replyRate - control.replyRate,
    bookingLift: treatment.bookingRate - control.bookingRate,
    enoughData: hasEnoughData(treatment.leads, control.leads),
  };
}

/** Tenant-scoped KPI summary from live data. */
export async function getDashboardKpis(tenantId: string): Promise<KpiSummary> {
  const leads = await db.lead.findMany({
    where: { tenantId },
    select: { id: true, researchCohort: true, status: true, researchCostCents: true },
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
    hasReply: repliedSet.has(l.id),
  }));
  return computeKpis(rows);
}
