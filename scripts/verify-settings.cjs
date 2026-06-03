/* Integration check: the encrypted Setting store round-trips against the live DB
 * using the real APP_ENCRYPTION_KEY (read from .env). Stores ciphertext, reads it
 * back, decrypts, confirms, cleans up. (Uses a non-secret key for the probe.)
 *   node scripts/verify-settings.cjs
 */
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const { createCipheriv, createDecipheriv, randomBytes, createHash } = require("crypto");

const env = fs.readFileSync(".env", "utf8");
const m = env.match(/^APP_ENCRYPTION_KEY=(.*)$/m);
process.env.APP_ENCRYPTION_KEY = m ? m[1].trim() : "";
const key = () => createHash("sha256").update(process.env.APP_ENCRYPTION_KEY).digest();
const enc = (pt) => {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key(), iv);
  const e = Buffer.concat([c.update(pt, "utf8"), c.final()]);
  return [iv.toString("base64"), c.getAuthTag().toString("base64"), e.toString("base64")].join(":");
};
const dec = (b) => {
  const [iv, t, e] = b.split(":");
  const d = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64"));
  d.setAuthTag(Buffer.from(t, "base64"));
  return Buffer.concat([d.update(Buffer.from(e, "base64")), d.final()]).toString("utf8");
};

const db = new PrismaClient();
(async () => {
  const k = "ANTHROPIC_MODEL";
  const v = "claude-probe-model-xyz";
  await db.setting.upsert({ where: { key: k }, update: { value: enc(v) }, create: { key: k, value: enc(v) } });
  const row = await db.setting.findUnique({ where: { key: k } });
  const back = dec(row.value);
  const ciphertextSafe = !row.value.includes(v);
  console.log("APP_ENCRYPTION_KEY loaded:", Boolean(process.env.APP_ENCRYPTION_KEY));
  console.log("stored as ciphertext (no plaintext):", ciphertextSafe);
  console.log("decrypts back to original:", back === v);
  const passed = ciphertextSafe && back === v;
  console.log("RESULT:", passed ? "PASS" : "FAIL");
  await db.setting.delete({ where: { key: k } });
  await db.$disconnect();
  process.exit(passed ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
