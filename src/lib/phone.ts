// Normalize phone numbers to E.164 at ingest, using libphonenumber-js for
// robust parsing + validation (BUILD_PLAN step 2). Returns null for anything
// that isn't a valid number, so Lead.phoneE164 never holds garbage.
import { parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

export function toE164(raw: string, defaultCountry: CountryCode = "US"): string | null {
  if (!raw) return null;
  const parsed = parsePhoneNumberFromString(String(raw).trim(), defaultCountry);
  if (!parsed || !parsed.isValid()) return null;
  return parsed.number; // canonical E.164, e.g. "+14155552671"
}
