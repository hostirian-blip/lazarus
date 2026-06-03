// Split-test assignment for the research agent.
// Assign each lead ONCE into "treatment" (research-on) or "control" (research-off),
// then hold it stable for the lead's lifetime so cohort data stays clean.
export function assignResearchCohort(rolloutPct: number): "treatment" | "control" {
  const pct = Math.max(0, Math.min(100, rolloutPct));
  return Math.random() * 100 < pct ? "treatment" : "control";
}

// TODO(claude-code): surface a "not enough data to call it" state in the dashboard
// until each cohort hits a minimum sample size for significance.
export function hasEnoughData(treatmentN: number, controlN: number, min = 100): boolean {
  return treatmentN >= min && controlN >= min;
}
