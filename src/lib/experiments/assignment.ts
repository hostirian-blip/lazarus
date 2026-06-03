// Split-test assignment for the research agent (BUILD_PLAN step 5).
// Assignment is DETERMINISTIC on the lead id: the same lead always lands in the
// same cohort, so it's stable for the lead's lifetime (non-negotiable rule) and
// reproducible/testable. Distribution converges to rolloutPct across many leads.
import { createHash } from "crypto";

export type Cohort = "treatment" | "control";

export function assignResearchCohort(leadId: string, rolloutPct: number): Cohort {
  const pct = Math.max(0, Math.min(100, Math.round(rolloutPct)));
  if (pct <= 0) return "control";
  if (pct >= 100) return "treatment";
  // First 4 bytes of sha256(leadId) -> 0..99 bucket.
  const bucket = createHash("sha256").update(leadId).digest().readUInt32BE(0) % 100;
  return bucket < pct ? "treatment" : "control";
}

// "Not enough data to call it" guard for the dashboard: don't show lift until each
// cohort has a minimum sample size.
export function hasEnoughData(treatmentN: number, controlN: number, min = 100): boolean {
  return treatmentN >= min && controlN >= min;
}
