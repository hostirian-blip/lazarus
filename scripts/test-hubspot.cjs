/* Logic check for BUILD_PLAN step 3 (no network): OAuth state sign/verify
 * round-trip + HubSpot contact -> CrmLead mapping. Mirrors hubspot-oauth.ts/hubspot.ts.
 *   node scripts/test-hubspot.cjs
 */
const { createHmac, timingSafeEqual, randomBytes } = require("crypto");

const SEC = "test-secret";
function signState(tenantId) {
  const payload = Buffer.from(JSON.stringify({ t: tenantId, n: randomBytes(8).toString("hex") })).toString("base64url");
  const sig = createHmac("sha256", SEC).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyState(state) {
  const [payload, sig] = (state || "").split(".");
  if (!payload || !sig) return null;
  const exp = createHmac("sha256", SEC).update(payload).digest("base64url");
  const a = Buffer.from(exp), b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof o.t === "string" ? { tenantId: o.t } : null;
  } catch {
    return null;
  }
}
function mapContact(c) {
  return {
    crmId: c.id,
    firstName: c.properties.firstname ?? undefined,
    lastName: c.properties.lastname ?? undefined,
    email: c.properties.email ?? undefined,
    phone: c.properties.phone ?? undefined,
    company: c.properties.company ?? undefined,
  };
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

const s = signState("tenant_abc");
chk("state verifies + returns tenantId", verifyState(s)?.tenantId === "tenant_abc");
chk("tampered state rejected", verifyState(s.slice(0, -2) + "xx") === null);
chk("garbage state rejected", verifyState("nope") === null);

const lead = mapContact({ id: "501", properties: { firstname: "Ada", lastname: "Lovelace", email: "ada@x.com", phone: "+12136212727", company: "AE" } });
chk("contact maps crmId", lead.crmId === "501");
chk("contact maps name/email/phone", lead.firstName === "Ada" && lead.email === "ada@x.com" && lead.phone === "+12136212727");
const sparse = mapContact({ id: "502", properties: { firstname: null, email: "x@y.com" } });
chk("missing props -> undefined", sparse.firstName === undefined && sparse.lastName === undefined && sparse.email === "x@y.com");

console.log(`hubspot logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
