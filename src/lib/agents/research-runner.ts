// Orchestrates research for a tenant's new leads (BUILD_PLAN step 5):
//  - assign each lead a cohort ONCE (stable) and persist it
//  - for treatment leads, run research while under the monthly spend cap
//  - meter cost per lead; store the brief only when confidence clears the threshold
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { tenantDb } from "@/lib/tenant";
import { assignResearchCohort } from "@/lib/experiments/assignment";
import { researchDecision, researchLead, ENTITY_CONFIDENCE_THRESHOLD } from "./research";

const EST_COST_CENTS = 2; // pre-flight estimate used for the cap check

export interface ResearchRunResult {
  assigned: number;
  researched: number;
  skippedControl: number;
  capReached: boolean;
  spentCentsThisMonth: number;
}

function monthStartUtc(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

export async function runResearchForNewLeads(tenantId: string, limit = 100): Promise<ResearchRunResult> {
  const scoped = tenantDb(tenantId);
  const tenant = await db.tenant.findUniqueOrThrow({ where: { id: tenantId } });
  const result: ResearchRunResult = {
    assigned: 0,
    researched: 0,
    skippedControl: 0,
    capReached: false,
    spentCentsThisMonth: 0,
  };

  const agg = await db.lead.aggregate({
    where: { tenantId, createdAt: { gte: monthStartUtc(new Date()) } },
    _sum: { researchCostCents: true },
  });
  let spent = agg._sum.researchCostCents ?? 0;
  result.spentCentsThisMonth = spent;

  const leads = await scoped.lead.findMany({ where: { status: "new" }, take: limit });
  for (const lead of leads) {
    let cohort = (lead.researchCohort as "treatment" | "control" | null) ?? null;
    if (!cohort) {
      cohort = assignResearchCohort(lead.id, tenant.researchRolloutPct);
      await scoped.lead.updateMany({ where: { id: lead.id }, data: { researchCohort: cohort } });
      result.assigned++;
    }
    if (cohort !== "treatment") {
      result.skippedControl++;
      continue;
    }

    const decision = researchDecision({
      enabled: tenant.researchEnabled,
      cohort,
      monthlyCapCents: tenant.researchMonthlyCap,
      spentThisMonthCents: spent,
      estCostCents: EST_COST_CENTS,
    });
    if (!decision.run) {
      if (decision.reason === "cap_reached") result.capReached = true;
      continue;
    }

    const brief = await researchLead({
      crmId: lead.crmId ?? "",
      firstName: lead.firstName ?? undefined,
      lastName: lead.lastName ?? undefined,
      email: lead.email ?? undefined,
      phone: lead.phoneE164 ?? undefined,
      company: lead.company ?? undefined,
    });
    spent += brief.costCents;
    result.spentCentsThisMonth = spent;

    const keepBrief = brief.confidence >= ENTITY_CONFIDENCE_THRESHOLD;
    await scoped.lead.updateMany({
      where: { id: lead.id },
      data: {
        researchCostCents: { increment: brief.costCents },
        status: "researching",
        ...(keepBrief ? { researchBrief: brief as unknown as Prisma.InputJsonValue } : {}),
      },
    });
    if (keepBrief) result.researched++;
  }

  return result;
}
