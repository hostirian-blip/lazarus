/* Logic check for webhook signature verification. Mirrors src/lib/webhooks/verify.ts.
 *   node scripts/test-webhooks.cjs
 */
const { createHmac, timingSafeEqual } = require("crypto");
function safeEq(a, b) {
  const A = Buffer.from(a), B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}
function twilioSig(authToken, url, params) {
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  return createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
}
const verifyTwilio = (t, u, p, sig) => safeEq(twilioSig(t, u, p), sig);
function stripeHeader(secret, payload, t) {
  const sig = createHmac("sha256", secret).update(`${t}.${payload}`, "utf8").digest("hex");
  return `t=${t},v1=${sig}`;
}
function verifyStripe(payload, header, secret) {
  const parts = {};
  for (const p of header.split(",")) { const [k, v] = p.split("="); if (k && v) parts[k] = v; }
  if (!parts.t || !parts.v1) return false;
  const exp = createHmac("sha256", secret).update(`${parts.t}.${payload}`, "utf8").digest("hex");
  return safeEq(exp, parts.v1);
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

const url = "https://x.io/api/webhooks/twilio";
const params = { From: "+1", Body: "hi", To: "+2" };
const sig = twilioSig("tok", url, params);
chk("twilio valid sig verifies", verifyTwilio("tok", url, params, sig));
chk("twilio wrong token rejected", !verifyTwilio("bad", url, params, sig));
chk("twilio tampered params rejected", !verifyTwilio("tok", url, { ...params, Body: "x" }, sig));

const t = Math.floor(Date.now() / 1000);
const h = stripeHeader("whsec", "payload123", t);
chk("stripe valid sig verifies", verifyStripe("payload123", h, "whsec"));
chk("stripe wrong secret rejected", !verifyStripe("payload123", h, "nope"));
chk("stripe tampered payload rejected", !verifyStripe("payloadX", h, "whsec"));

console.log(`webhook verify: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
