/* Logic check for the secret encryption (AES-256-GCM). Mirrors secretbox.ts.
 *   node scripts/test-crypto.cjs
 */
const { createCipheriv, createDecipheriv, randomBytes, createHash } = require("crypto");
process.env.APP_ENCRYPTION_KEY = process.env.APP_ENCRYPTION_KEY || "unit-test-key";
const key = () => createHash("sha256").update(process.env.APP_ENCRYPTION_KEY).digest();

function enc(pt) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const e = Buffer.concat([c.update(pt, "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), e.toString("base64")].join(":");
}
function dec(blob) {
  const [iv, tag, e] = blob.split(":");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([d.update(Buffer.from(e, "base64")), d.final()]).toString("utf8");
}

let pass = 0, fail = 0;
const chk = (n, c) => (c ? (pass++, console.log("  ✓", n)) : (fail++, console.log("  ✗", n)));

const secret = "sk-ant-XYZ-super-secret-123";
const blob = enc(secret);
chk("round-trips to original", dec(blob) === secret);
chk("ciphertext != plaintext", !blob.includes(secret));
chk("each encryption uses a fresh IV", enc(secret) !== enc(secret));
let tampered = false;
try { dec(blob.slice(0, -4) + "AAAA"); } catch { tampered = true; }
chk("tampered blob rejected (auth tag)", tampered);

console.log(`crypto logic: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
