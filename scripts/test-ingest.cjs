/* Logic check for BUILD_PLAN step 2 (no DB writes): parse the sample CSV with the
 * same libs the app uses (xlsx + libphonenumber-js), normalize phones to E.164,
 * and dedupe within the file. Proves "clean rows, valid E.164, no dupes".
 *   node scripts/test-ingest.cjs
 */
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");
const { parsePhoneNumberFromString } = require("libphonenumber-js");

function toE164(raw, country = "US") {
  if (!raw) return null;
  const p = parsePhoneNumberFromString(String(raw).trim(), country);
  return p && p.isValid() ? p.number : null;
}

const buf = fs.readFileSync(path.join(__dirname, "sample-leads.csv"));
const wb = XLSX.read(buf, { type: "buffer" });
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });

const seen = new Set();
let created = 0,
  dupes = 0,
  invalid = 0;
const clean = [];
for (const r of rows) {
  const phoneE164 = toE164(r.phone);
  const email = r.email ? String(r.email).toLowerCase() : null;
  if (!phoneE164 && !email) {
    invalid++;
    continue;
  }
  const key = phoneE164 ? `p:${phoneE164}` : `e:${email}`;
  if (seen.has(key)) {
    dupes++;
    continue;
  }
  seen.add(key);
  created++;
  clean.push({ name: `${r.first_name} ${r.last_name}`.trim(), phoneE164, email });
}

console.log("rows:", rows.length, "| created:", created, "| dupesInFile:", dupes, "| invalid:", invalid);
for (const c of clean) console.log("  ✓", c.name, "→", c.phoneE164 ?? "(email only)");
