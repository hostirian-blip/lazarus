// Encrypt OAuth tokens at rest using the shared AES-256-GCM secretbox.
import { encryptSecret, decryptSecret } from "@/lib/crypto/secretbox";

export function encToken(plaintext: string): string {
  return encryptSecret(plaintext);
}

// Tolerant decrypt: our blobs are "iv:tag:enc" (3 base64 segments). Anything
// else (e.g. a legacy plaintext token written before encryption) is returned
// as-is so existing connections keep working through the next refresh.
export function decToken(value: string): string {
  if (value.split(":").length !== 3) return value;
  try {
    return decryptSecret(value);
  } catch {
    return value;
  }
}
