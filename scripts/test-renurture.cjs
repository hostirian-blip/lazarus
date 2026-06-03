/* Logic check for BUILD_PLAN step 6 (no LLM): the generic fallback message.
 * Mirrors genericMessage() in src/lib/agents/renurture.ts.
 *   node scripts/test-renurture.cjs
 */
function genericMessage(args) {
  const name = (args.lead.firstName || "").trim() || "there";
  if (args.channel === "sms") {
    return { body: `Hi ${name}, following up from a while back — are you still looking into this? Happy to share something useful. Reply STOP to opt out.` };
  }
  return { subject: `Following up, ${name}`, body: `Hi ${name},\n\nWe were in touch a while ago...` };
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

const sms = genericMessage({ lead: { firstName: "Ada" }, channel: "sms", brandVoice: "warm" });
chk("sms greets by name", sms.body.includes("Ada"));
chk("sms has STOP footer (compliance)", /reply stop to opt out/i.test(sms.body));
chk("sms under 320 chars", sms.body.length <= 320);
chk("sms has no subject", sms.subject === undefined);

const noName = genericMessage({ lead: {}, channel: "sms", brandVoice: "warm" });
chk('missing name -> "there"', noName.body.includes("Hi there"));

const email = genericMessage({ lead: { firstName: "Grace" }, channel: "email", brandVoice: "warm" });
chk("email has subject", typeof email.subject === "string" && email.subject.includes("Grace"));
chk("email body greets by name", email.body.includes("Grace"));

console.log(`renurture logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
