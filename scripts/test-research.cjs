/* Logic check for BUILD_PLAN step 5 (no DB/LLM): deterministic split-test
 * distribution + stability, and the research spend/flag/cohort decision gate.
 * Mirrors src/lib/experiments/assignment.ts + src/lib/agents/research.ts.
 *   node scripts/test-research.cjs
 */
const { createHash } = require("crypto");

function assign(leadId, rolloutPct) {
  const pct = Math.max(0, Math.min(100, Math.round(rolloutPct)));
  if (pct <= 0) return "control";
  if (pct >= 100) return "treatment";
  const bucket = createHash("sha256").update(leadId).digest().readUInt32BE(0) % 100;
  return bucket < pct ? "treatment" : "control";
}
function decision({ enabled, cohort, monthlyCapCents, spentThisMonthCents, estCostCents = 0 }) {
  if (!enabled) return { run: false, reason: "research_disabled" };
  if (cohort !== "treatment") return { run: false, reason: "control_cohort" };
  if (monthlyCapCents <= 0) return { run: false, reason: "no_cap_set" };
  if (spentThisMonthCents + estCostCents > monthlyCapCents) return { run: false, reason: "cap_reached" };
  return { run: true, reason: "ok" };
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

let t = 0;
const N = 5000;
for (let i = 0; i < N; i++) if (assign("lead_" + i, 10) === "treatment") t++;
const pctT = (t / N) * 100;
chk(`rollout=10% -> ~10% treatment (got ${pctT.toFixed(1)}%)`, pctT > 7 && pctT < 13);
chk("assignment stable for same id", assign("lead_42", 10) === assign("lead_42", 10));
chk("rollout=0 -> control", assign("anyone", 0) === "control");
chk("rollout=100 -> treatment", assign("anyone", 100) === "treatment");

chk("treatment under cap -> run", decision({ enabled: true, cohort: "treatment", monthlyCapCents: 1000, spentThisMonthCents: 100, estCostCents: 2 }).run === true);
chk("control -> no run", decision({ enabled: true, cohort: "control", monthlyCapCents: 1000, spentThisMonthCents: 0 }).run === false);
chk("disabled -> no run", decision({ enabled: false, cohort: "treatment", monthlyCapCents: 1000, spentThisMonthCents: 0 }).run === false);
chk("cap reached -> halts", decision({ enabled: true, cohort: "treatment", monthlyCapCents: 100, spentThisMonthCents: 100, estCostCents: 2 }).reason === "cap_reached");
chk("no cap set -> no run", decision({ enabled: true, cohort: "treatment", monthlyCapCents: 0, spentThisMonthCents: 0 }).run === false);

console.log(`research logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
