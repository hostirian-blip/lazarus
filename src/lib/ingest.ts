// Contact ingest (BUILD_PLAN step 2 + import wizard). Parse CSV/XLSX, apply a
// field->column mapping (explicit or auto-suggested), normalize phones to E.164,
// dedupe (in-file + against the tenant's leads), capture consent, then insert.
// Always tenant-scoped via TenantDb. Supports dryRun (count without inserting).
import * as XLSX from "xlsx";
import type { CountryCode } from "libphonenumber-js";
import { toE164 } from "@/lib/phone";
import type { TenantDb } from "@/lib/tenant";

export type Field = "firstName" | "lastName" | "email" | "phoneE164" | "company";
export type FieldMapping = Partial<Record<Field, string>>; // our field -> source column header

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

export interface PreviewResult {
  headers: string[];
  sample: Record<string, unknown>[];
  totalRows: number;
  mapping: FieldMapping;
}

export interface IngestOpts {
  mapping?: FieldMapping;
  consentSource?: string;
  smsConsent?: boolean;
  emailConsent?: boolean;
  defaultCountry?: CountryCode;
  dryRun?: boolean;
}

const FIELD_ALIASES: Record<Field, string[]> = {
  firstName: ["first name", "firstname", "first", "fname", "given name"],
  lastName: ["last name", "lastname", "last", "lname", "surname", "family name"],
  email: ["email", "e mail", "email address"],
  phoneE164: ["phone", "phone number", "mobile", "cell", "cellphone", "telephone", "tel"],
  company: ["company", "organization", "organisation", "org", "business", "account", "company name"],
};

function normalizeHeader(h: string): string {
  return String(h).toLowerCase().trim().replace(/[\s_]+/g, " ");
}

function clean(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

export function parseRows(buffer: Buffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "buffer" });
  const sheetName = wb.SheetNames[0];
  const sheet = sheetName ? wb.Sheets[sheetName] : undefined;
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });
}

/** Suggest a field -> column mapping from the headers via alias matching. */
export function suggestMapping(headers: string[]): FieldMapping {
  const map: FieldMapping = {};
  for (const header of headers) {
    const norm = normalizeHeader(header);
    for (const f of Object.keys(FIELD_ALIASES) as Field[]) {
      if (!map[f] && FIELD_ALIASES[f].includes(norm)) {
        map[f] = header;
        break;
      }
    }
  }
  return map;
}

/** Parse + suggest mapping without touching the database (wizard step 1). */
export function previewContacts(buffer: Buffer): PreviewResult {
  const rows = parseRows(buffer);
  const headers = rows.length ? Object.keys(rows[0]) : [];
  return { headers, sample: rows.slice(0, 5), totalRows: rows.length, mapping: suggestMapping(headers) };
}

function dedupeKey(c: ParsedContact): string | null {
  if (c.phoneE164) return `p:${c.phoneE164}`;
  if (c.email) return `e:${c.email.toLowerCase()}`;
  return null;
}

export async function ingestContacts(scoped: TenantDb, buffer: Buffer, opts: IngestOpts = {}): Promise<IngestResult> {
  const rows = parseRows(buffer);
  const result: IngestResult = { totalRows: rows.length, created: 0, duplicatesInFile: 0, duplicatesExisting: 0, invalid: [] };
  if (rows.length === 0) return result;

  const mapping = opts.mapping ?? suggestMapping(Object.keys(rows[0]));
  const country = opts.defaultCountry ?? "US";

  // Pass 1: map + normalize + in-file dedupe.
  const seen = new Set<string>();
  const candidates: ParsedContact[] = [];
  rows.forEach((row, i) => {
    const c: ParsedContact = { firstName: null, lastName: null, email: null, phoneE164: null, company: null };
    if (mapping.firstName) c.firstName = clean(row[mapping.firstName]);
    if (mapping.lastName) c.lastName = clean(row[mapping.lastName]);
    if (mapping.company) c.company = clean(row[mapping.company]);
    if (mapping.email) {
      const e = clean(row[mapping.email]);
      c.email = e ? e.toLowerCase() : null;
    }
    const rawPhone = mapping.phoneE164 ? clean(row[mapping.phoneE164]) : null;
    if (rawPhone) c.phoneE164 = toE164(rawPhone, country);

    if (!c.phoneE164 && !c.email) {
      result.invalid.push({ row: i + 2, reason: rawPhone ? "phone not valid/parseable and no email" : "no phone or email" });
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

  // Pass 2: dedupe against existing tenant leads.
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
    if (!opts.dryRun) {
      await scoped.lead.create({
        firstName: c.firstName ?? undefined,
        lastName: c.lastName ?? undefined,
        email: c.email ?? undefined,
        phoneE164: c.phoneE164 ?? undefined,
        company: c.company ?? undefined,
        consentSource: opts.consentSource ?? undefined,
        smsConsent: opts.smsConsent ?? false,
        emailConsent: opts.emailConsent ?? false,
      });
    }
    if (keyPhone) existingKeys.add(keyPhone);
    if (keyEmail) existingKeys.add(keyEmail);
    result.created++;
  }

  return result;
}
