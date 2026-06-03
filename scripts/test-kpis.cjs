/* Logic check for BUILD_PLAN step 8 + revenue ROI: cohort KPI math, lift,
 * revenue/lead + net ROI, and the "not enough data" gate. Mirrors analytics/kpis.ts.
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
  const revenueCents = rows.reduce((s, r) => s + r.revenueCents, 0);
  return {
    leads, researched, costCents, replied, booked,
    replyRate: leads ? replied / leads : 0,
    bookingRate: leads ? booked / leads : 0,
    costPerResearchedCents: researched ? Math.round(costCents / researched) : 0,
    revenueCents,
    revenuePerLeadCents: leads ? Math.round(revenueCents / leads) : 0,
  };
}
function computeKpis(rows) {
  const t = cohortStats(rows.filter((r) => r.cohort === "treatment"));
  const c = cohortStats(rows.filter((r) => r.cohort === "control"));
  const revenueLiftPerLeadCents = t.revenuePerLeadCents - c.revenuePerLeadCents;
  const researchCostPerLeadCents = t.leads ? Math.round(t.costCents / t.leads) : 0;
  return {
    treatment: t, control: c,
    bookingLift: t.bookingRate - c.bookingRate,
    revenueLiftPerLeadCents,
    researchCostPerLeadCents,
    netRoiPerLeadCents: revenueLiftPerLeadCents - researchCostPerLeadCents,
    enoughData: hasEnoughData(t.leads, c.leads),
  };
}

const rows = [];
// treatment: 120 leads, 30 booked (each $100), research cost 2c each
for (let i = 0; i < 120; i++) rows.push({ cohort: "treatment", status: i < 30 ? "booked" : "new", researchCostCents: 2, revenueCents: i < 30 ? 10000 : 0, hasReply: false });
// control: 120 leads, 12 booked (each $100), no research
for (let i = 0; i < 120; i++) rows.push({ cohort: "control", status: i < 12 ? "booked" : "new", researchCostCents: 0, revenueCents: i < 12 ? 10000 : 0, hasReply: false });

const k = computeKpis(rows);
let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

chk("treatment revenue/lead = 30*10000/120 = 2500c", k.treatment.revenuePerLeadCents === 2500);
chk("control revenue/lead = 12*10000/120 = 1000c", k.control.revenuePerLeadCents === 1000);
chk("revenue lift/lead = 1500c", k.revenueLiftPerLeadCents === 1500);
chk("research cost/lead = 2c", k.researchCostPerLeadCents === 2);
chk("net ROI/lead = 1498c", k.netRoiPerLeadCents === 1498);
chk("booking lift = .15", Math.abs(k.bookingLift - 0.15) < 1e-9);
chk("enoughData true at 120/120", k.enoughData === true);

console.log(`kpi+revenue logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
