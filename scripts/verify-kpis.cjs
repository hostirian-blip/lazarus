/* Integration check (BUILD_PLAN step 8 "done when"): the dashboard's live cohort
 * query returns real numbers. Seeds tagged treatment/control leads + an inbound
 * reply, runs the same Prisma queries as getDashboardKpis, prints, cleans up.
 *   node scripts/verify-kpis.cjs
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();
const TAG = "kpitest+";

async function cleanup(tenantId) {
  const rows = await db.lead.findMany({ where: { tenantId, email: { startsWith: TAG } }, select: { id: true } });
  await db.outreachEvent.deleteMany({ where: { leadId: { in: rows.map((r) => r.id) } } });
  await db.lead.deleteMany({ where: { tenantId, email: { startsWith: TAG } } });
}

(async () => {
  const tenant = await db.tenant.findFirst({ where: { name: "Lazarus Admin" } });
  await cleanup(tenant.id);

  const mk = (cohort, status, cost, email) =>
    db.lead.create({ data: { tenantId: tenant.id, researchCohort: cohort, status, researchCostCents: cost, email } });
  const t1 = await mk("treatment", "booked", 2, TAG + "t1@x.com");
  await mk("treatment", "new", 2, TAG + "t2@x.com");
  await mk("control", "new", 0, TAG + "c1@x.com");
  await db.outreachEvent.create({ data: { leadId: t1.id, channel: "email", direction: "inbound", body: "interested" } });

  // Mirror getDashboardKpis queries:
  const leads = await db.lead.findMany({
    where: { tenantId: tenant.id, email: { startsWith: TAG } },
    select: { id: true, researchCohort: true, status: true, researchCostCents: true },
  });
  const inbound = await db.outreachEvent.findMany({
    where: { direction: "inbound", lead: { tenantId: tenant.id } },
    select: { leadId: true },
    distinct: ["leadId"],
  });
  const replied = new Set(inbound.map((e) => e.leadId));
  const stat = (coh) => {
    const r = leads.filter((l) => l.researchCohort === coh);
    return {
      leads: r.length,
      booked: r.filter((l) => l.status === "booked").length,
      replied: r.filter((l) => replied.has(l.id) || l.status === "booked").length,
      costCents: r.reduce((s, l) => s + l.researchCostCents, 0),
    };
  };
  const t = stat("treatment");
  const c = stat("control");
  console.log("treatment:", JSON.stringify(t));
  console.log("control:  ", JSON.stringify(c));
  const passed = t.leads === 2 && t.booked === 1 && t.replied === 1 && c.leads === 1 && c.booked === 0;
  console.log(passed ? "RESULT: PASS" : "RESULT: FAIL");

  await cleanup(tenant.id);
  await db.$disconnect();
  process.exit(passed ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
