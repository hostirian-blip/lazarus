/* Integration check (BUILD_PLAN step 7): inbound email reply logs as an
 * OutreachEvent. Creates a temp lead, POSTs the email webhook, verifies, cleans up.
 * (Outbound send + its consent gate are covered by step 4's canContact tests and
 *  are gated behind Twilio/email creds for live sending.)
 *   node scripts/verify-dispatch.cjs
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

(async () => {
  const tenant = await db.tenant.findFirst({ where: { name: "Lazarus Admin" } });
  if (!tenant) throw new Error("admin tenant missing");
  const email = "replytest@example.com";
  await db.lead.deleteMany({ where: { email } });
  const lead = await db.lead.create({ data: { tenantId: tenant.id, email, firstName: "Reply" } });

  const res = await fetch("http://127.0.0.1:3001/api/webhooks/email", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ from: `Reply Person <${email}>`, text: "Yes, I'm interested - call me" }),
  });

  const events = await db.outreachEvent.findMany({ where: { leadId: lead.id } });
  const inbound = events.find((e) => e.direction === "inbound" && e.channel === "email");
  console.log("email webhook HTTP:", res.status);
  console.log("inbound email event logged:", Boolean(inbound), inbound ? `("${inbound.body}")` : "");

  const passed = res.status === 200 && Boolean(inbound);
  console.log(passed ? "RESULT: PASS" : "RESULT: FAIL");

  await db.outreachEvent.deleteMany({ where: { leadId: lead.id } });
  await db.lead.delete({ where: { id: lead.id } });
  await db.$disconnect();
  process.exit(passed ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
