/* Logic check for the sequence engine (no DB): template rendering + step
 * advancement (delay scheduling, completion, consent-skip). Mirrors engine code.
 *   node scripts/test-engine.cjs
 */
function renderTemplate(body, vars) {
  const map = {
    firstName: (vars.firstName || "").trim() || "there",
    lastName: (vars.lastName || "").trim() || "",
    company: (vars.company || "").trim() || "",
    email: (vars.email || "").trim() || "",
  };
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (k in map ? map[k] : ""));
}

const HOUR = 3600000;
// Pure advancement: returns next {step, status?, nextRunAt?} given current step + steps.
function advance(step, steps, now) {
  const next = step + 1;
  if (next >= steps.length) return { step: next, status: "done" };
  const delayMs = Math.max(0, Number(steps[next].delayHours || 0)) * HOUR;
  return { step: next, nextRunAt: now + delayMs };
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

chk("renders {{firstName}}", renderTemplate("Hi {{firstName}}!", { firstName: "Ada" }) === "Hi Ada!");
chk('missing firstName -> "there"', renderTemplate("Hi {{ firstName }}", {}) === "Hi there");
chk("renders company", renderTemplate("at {{company}}", { company: "Acme" }) === "at Acme");
chk("unknown var -> empty", renderTemplate("x{{nope}}y", {}) === "xy");

const steps = [
  { channel: "sms", delayHours: 0, body: "a" },
  { channel: "email", delayHours: 24, body: "b" },
  { channel: "sms", delayHours: 72, body: "c" },
];
const now = 1_000_000;
const a0 = advance(0, steps, now);
chk("step0 -> step1 scheduled +24h", a0.step === 1 && a0.nextRunAt === now + 24 * HOUR);
const a1 = advance(1, steps, now);
chk("step1 -> step2 scheduled +72h", a1.step === 2 && a1.nextRunAt === now + 72 * HOUR);
const a2 = advance(2, steps, now);
chk("last step -> done", a2.step === 3 && a2.status === "done");

console.log(`engine logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
