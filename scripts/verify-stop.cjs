/* Integration check (BUILD_PLAN step 4 "done when"): a STOP text sets optedOut
 * and blocks future sends. Creates a temp lead, POSTs the Twilio webhook, checks
 * the result, then cleans up. Requires the app running on :3001.
 *   node scripts/verify-stop.cjs
 */
const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

function canContact(lead, ch) {
  if (lead.optedOut) return { ok: false, reason: "opted_out" };
  if (ch === "sms" && !lead.smsConsent) return { ok: false, reason: "no_sms_consent" };
  return { ok: true };
}

(async () => {
  const tenant = await db.tenant.findFirst({ where: { name: "Lazarus Admin" } });
  if (!tenant) throw new Error("admin tenant missing");
  const phone = "+15550001111";
  await db.lead.deleteMany({ where: { phoneE164: phone } }); // clean slate

  const lead = await db.lead.create({
    data: { tenantId: tenant.id, phoneE164: phone, smsConsent: true, firstName: "Stop", email: "stoptest@example.com" },
  });
  console.log("before: smsConsent=%s optedOut=%s -> canContact(sms)=%s",
    lead.smsConsent, lead.optedOut, canContact(lead, "sms").ok);

  const res = await fetch("http://127.0.0.1:3001/api/webhooks/twilio", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: phone, Body: "STOP", To: "+15559998888", MessageSid: "SMtest" }),
  });
  const twiml = await res.text();

  const after = await db.lead.findUnique({ where: { id: lead.id } });
  const events = await db.outreachEvent.count({ where: { leadId: lead.id } });
  console.log("webhook: HTTP %s, twiml confirms unsubscribe=%s", res.status, /unsubscribed/i.test(twiml));
  console.log("after:  smsConsent=%s optedOut=%s -> canContact(sms)=%s",
    after.smsConsent, after.optedOut, canContact(after, "sms").ok);
  console.log("inbound events logged:", events);

  const passed = after.optedOut === true && canContact(after, "sms").ok === false && res.status === 200;
  console.log(passed ? "RESULT: PASS" : "RESULT: FAIL");

  // cleanup
  await db.outreachEvent.deleteMany({ where: { leadId: lead.id } });
  await db.lead.delete({ where: { id: lead.id } });
  await db.$disconnect();
  process.exit(passed ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
