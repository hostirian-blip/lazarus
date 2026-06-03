import type { CrmLead } from "../connectors/types";

export interface ResearchBrief {
  summary: string;       // who they are
  whatsChanged: string;  // recent signal worth referencing
  hook: string;          // opening angle
  confidence: number;    // 0-1 entity-match confidence
  costCents: number;
}

// Research agent — runs ONLY for leads in the "treatment" cohort and within the
// tenant's monthly spend cap. Enriches via web + an enrichment provider, then
// returns a personalization brief for the re-nurture agent.
//
// Guardrails:
//  - Entity resolution: if confidence < threshold, return generic (don't guess).
//  - Meter cost per lead (costCents) and stop when the tenant cap is hit.
export async function researchLead(_lead: CrmLead): Promise<ResearchBrief> {
  throw new Error("not implemented: researchLead");
}

export const ENTITY_CONFIDENCE_THRESHOLD = 0.7;
