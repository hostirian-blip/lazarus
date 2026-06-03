/* Logic check for BUILD_PLAN step 4 (no DB): consent gate + inbound keyword
 * classification + unsubscribe token round-trip. Mirrors src/lib/consent/*.
 *   node scripts/test-consent.cjs
 */
const { createHmac, timingSafeEqual } = require("crypto");

const STOP = new Set(["stop", "stopall", "stop all", "unsubscribe", "cancel", "end", "quit", "optout", "opt out"]);
const START = new Set(["start", "unstop", "yes", "optin", "opt in"]);
const HELP = new Set(["help", "info"]);
function classifyInbound(b) {
  const t = (b || "").trim().toLowerCase();
  if (STOP.has(t)) return "stop";
  if (START.has(t)) return "start";
  if (HELP.has(t)) return "help";
  return "message";
}
function canContact(lead, ch) {
  if (lead.optedOut) return { ok: false, reason: "opted_out" };
  if (ch === "sms" && !lead.smsConsent) return { ok: false, reason: "no_sms_consent" };
  if (ch === "email" && !lead.emailConsent) return { ok: false, reason: "no_email_consent" };
  return { ok: true };
}
const SEC = "test-secret";
const tok = (id) => createHmac("sha256", SEC).update(id).digest("hex");
const verify = (id, t) => {
  const a = Buffer.from(tok(id));
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
};

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

chk('"Stop" -> stop', classifyInbound("Stop") === "stop");
chk('"UNSUBSCRIBE" -> stop', classifyInbound("UNSUBSCRIBE") === "stop");
chk('"help" -> help', classifyInbound("help") === "help");
chk('"hi there" -> message', classifyInbound("hi there") === "message");
chk("no SMS consent blocks send", canContact({ optedOut: false, smsConsent: false, emailConsent: true }, "sms").ok === false);
chk("SMS consent allows send", canContact({ optedOut: false, smsConsent: true, emailConsent: false }, "sms").ok === true);
chk("optedOut blocks everything", canContact({ optedOut: true, smsConsent: true, emailConsent: true }, "email").ok === false);
const t = tok("lead_123");
chk("valid token verifies", verify("lead_123", t));
chk("token for other lead rejected", !verify("lead_124", t));
chk("garbage token rejected", !verify("lead_123", "deadbeef"));

console.log(`consent logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
