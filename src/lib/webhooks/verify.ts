// Inbound webhook signature verification (Twilio, Stripe).
import { createHmac, timingSafeEqual } from "crypto";

function safeEq(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  if (A.length !== B.length) return false;
  return timingSafeEqual(A, B);
}

// Twilio: base64( HMAC-SHA1( authToken, fullUrl + concat(sortedKey+value) ) )
export function verifyTwilioSignature(authToken: string, url: string, params: Record<string, string>, signature: string): boolean {
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(Buffer.from(data, "utf-8")).digest("base64");
  return safeEq(expected, signature);
}

// Stripe: header "t=<ts>,v1=<sig>"; sig = HMAC-SHA256(secret, `${t}.${payload}`)
export function verifyStripeSignature(payload: string, header: string, secret: string, toleranceSec = 300): boolean {
  const parts: Record<string, string> = {};
  for (const p of (header || "").split(",")) {
    const [k, v] = p.split("=");
    if (k && v) parts[k] = v;
  }
  if (!parts.t || !parts.v1) return false;
  const expected = createHmac("sha256", secret).update(`${parts.t}.${payload}`, "utf8").digest("hex");
  if (!safeEq(expected, parts.v1)) return false;
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  return Number.isFinite(age) && age <= toleranceSec;
}
