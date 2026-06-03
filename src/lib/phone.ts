// Normalize phone numbers to E.164 at ingest. Swap in libphonenumber-js for real use.
export function toE164(raw: string, defaultCountry = "US"): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (defaultCountry === "US" && digits.length === 10) return `+1${digits}`;
  if (defaultCountry === "US" && digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null; // TODO(claude-code): use libphonenumber-js for robust parsing
}
