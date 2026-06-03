// Contact ingest (BUILD_PLAN step 2): parse an uploaded CSV/XLSX, map columns
// to Lead fields, normalize phones to E.164, dedupe (within the file AND against
// the tenant's existing leads), then insert. Always tenant-scoped via TenantDb,
// so ingest can never write into another tenant's data.
import * as XLSX from "xlsx";
import type { CountryCode } from "libphonenumber-js";
import { toE164 } from "@/lib/phone";
import type { TenantDb } from "@/lib/tenant";

export interface ParsedContact {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneE164: string | null;
  company: string | null;
}

export interface IngestResult {
  totalRows: number;
  created: number;
  duplicatesInFile: number;
  duplicatesExisting: number;
  invalid: { row: number; reason: string }[];
}

const FIELD_ALIASES: Record<keyof ParsedContact, string[]> = {
  firstName: ["first name", "firstname", "first", "fname", "given name"],
  lastName: ["last name", "lastname", "last", "lname", "surname", "family name"],
  email: ["email", "e mail", "email address"],
  phoneE164: ["phone", "phone number", "mobile", "cell", "cellphone", "telephone", "tel"],
  company: ["company", "organization", "organisation", "org", "business", "account", "company name"],
};

function normalizeHeader(h: string): string {
  return String(h).toLowerCase().trim().replace(/[\s_]+/g, " ");
}

/** Map each source column header to one of our fields via alias matching. */
function mapColumns(headers: string[]): Record<string, keyof ParsedContact> {
  const map: Record<string, keyof ParsedContact> = {};
  for (const header of headers) {
    const norm = normalizeHeader(header);
    for (const field of Object.keys(FIELD_ALIASES) as (keyof ParsedContact)[]) {
      if (FIELD_ALIASES[field].includes(norm)) {
        map[header] = field;
        break;
      }
    }
  }
  return map;
}

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

/** Parse a CSV/XLSX buffer into header-keyed row objects (first sheet). */
export function parseRows(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

/** Stable dedupe key for a contact: prefer phone, fall back to email. */
function dedupeKey(c: ParsedContact): string | null {
  if (c.phoneE164) return `p:${c.phoneE164}`;
  if (c.email) return `e:${c.email.toLowerCase()}`;
  return null;
}

export async function ingestContacts(
  scoped: TenantDb,
  buffer: Buffer,
  defaultCountry: CountryCode = "US",
): Promise<IngestResult> {
  const rows = parseRows(buffer);
  const result: IngestResult = {
    totalRows: rows.length,
    created: 0,
    duplicatesInFile: 0,
    duplicatesExisting: 0,
    invalid: [],
  };
  if (rows.length === 0) return result;

  const columnMap = mapColumns(Object.keys(rows[0]));

  // Pass 1: normalize fields + dedupe within the file.
  const seen = new Set<string>();
  const candidates: ParsedContact[] = [];
  rows.forEach((row, i) => {
    const c: ParsedContact = {
      firstName: null,
      lastName: null,
      email: null,
      phoneE164: null,
      company: null,
    };
    let hadPhoneInput = false;
    for (const [col, field] of Object.entries(columnMap)) {
      const val = clean(row[col]);
      if (!val) continue;
      if (field === "phoneE164") {
        hadPhoneInput = true;
        c.phoneE164 = toE164(val, defaultCountry);
      } else if (field === "email") {
        c.email = val.toLowerCase();
      } else {
        c[field] = val;
      }
    }

    // A lead needs at least a valid phone or an email to be reachable.
    if (!c.phoneE164 && !c.email) {
      result.invalid.push({
        row: i + 2, // +1 for header, +1 for 1-based
        reason: hadPhoneInput ? "phone not valid/parseable and no email" : "no phone or email",
      });
      return;
    }

    const key = dedupeKey(c);
    if (key && seen.has(key)) {
      result.duplicatesInFile++;
      return;
    }
    if (key) seen.add(key);
    candidates.push(c);
  });

  // Pass 2: dedupe against the tenant's existing leads (by phone or email).
  const phones = candidates.map((c) => c.phoneE164).filter((v): v is string => !!v);
  const emails = candidates.map((c) => c.email).filter((v): v is string => !!v);
  const existing = await scoped.lead.findMany({
    where: { OR: [{ phoneE164: { in: phones } }, { email: { in: emails } }] },
    select: { phoneE164: true, email: true },
  });
  const existingKeys = new Set<string>();
  for (const e of existing) {
    if (e.phoneE164) existingKeys.add(`p:${e.phoneE164}`);
    if (e.email) existingKeys.add(`e:${e.email.toLowerCase()}`);
  }

  for (const c of candidates) {
    const keyPhone = c.phoneE164 ? `p:${c.phoneE164}` : null;
    const keyEmail = c.email ? `e:${c.email.toLowerCase()}` : null;
    if ((keyPhone && existingKeys.has(keyPhone)) || (keyEmail && existingKeys.has(keyEmail))) {
      result.duplicatesExisting++;
      continue;
    }
    await scoped.lead.create({
      firstName: c.firstName ?? undefined,
      lastName: c.lastName ?? undefined,
      email: c.email ?? undefined,
      phoneE164: c.phoneE164 ?? undefined,
      company: c.company ?? undefined,
      // consent fields stay false by default — the Step 4 gate must pass before any send.
    });
    if (keyPhone) existingKeys.add(keyPhone);
    if (keyEmail) existingKeys.add(keyEmail);
    result.created++;
  }

  return result;
}
