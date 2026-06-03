/* Logic check for BUILD_PLAN step 8 (no DB): cohort KPI math + lift +
 * "not enough data" gate. Mirrors src/lib/analytics/kpis.ts.
 *   node scripts/test-kpis.cjs
 */
function hasEnoughData(t, c, min = 100) {
  return t >= min && c >= min;
}
function cohortStats(rows) {
  const leads = rows.length;
  const researched = rows.filter((r) => r.researchCostCents > 0).length;
  const costCents = rows.reduce((s, r) => s + r.researchCostCents, 0);
  const replied = rows.filter((r) => r.hasReply || r.status === "replied" || r.status === "booked").length;
  const booked = rows.filter((r) => r.status === "booked").length;
  return {
    leads, researched, costCents, replied, booked,
    replyRate: leads ? replied / leads : 0,
    bookingRate: leads ? booked / leads : 0,
    costPerResearchedCents: researched ? Math.round(costCents / researched) : 0,
  };
}
function computeKpis(rows) {
  const t = cohortStats(rows.filter((r) => r.cohort === "treatment"));
  const c = cohortStats(rows.filter((r) => r.cohort === "control"));
  return { treatment: t, control: c, replyLift: t.replyRate - c.replyRate, bookingLift: t.bookingRate - c.bookingRate, enoughData: hasEnoughData(t.leads, c.leads) };
}

// Synthetic: treatment outperforms control.
const rows = [];
for (let i = 0; i < 120; i++) rows.push({ cohort: "treatment", status: i < 30 ? "booked" : i < 60 ? "replied" : "new", researchCostCents: 2, hasReply: false });
for (let i = 0; i < 120; i++) rows.push({ cohort: "control", status: i < 12 ? "booked" : i < 30 ? "replied" : "new", researchCostCents: 0, hasReply: false });

const k = computeKpis(rows);
let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

chk("treatment booking rate = 30/120 = .25", Math.abs(k.treatment.bookingRate - 0.25) < 1e-9);
chk("control booking rate = 12/120 = .10", Math.abs(k.control.bookingRate - 0.1) < 1e-9);
chk("treatment reply rate = 60/120 = .50", Math.abs(k.treatment.replyRate - 0.5) < 1e-9);
chk("booking lift = .15", Math.abs(k.bookingLift - 0.15) < 1e-9);
chk("cost/researched = 2c", k.treatment.costPerResearchedCents === 2);
chk("control cost/researched = 0 (none researched)", k.control.costPerResearchedCents === 0);
chk("enoughData true at 120/120", k.enoughData === true);

const small = computeKpis([{ cohort: "treatment", status: "new", researchCostCents: 0, hasReply: false }]);
chk("enoughData false with tiny sample", small.enoughData === false);

console.log(`kpi logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
