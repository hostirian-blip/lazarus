// Minimal Stripe REST client (no SDK) using the stored secret key. Returns null
// when Stripe isn't configured so callers can respond 501.
import { getSetting } from "@/lib/settings/platform";

async function stripeForm(path: string, params: Record<string, string>): Promise<Record<string, unknown> | null> {
  const key = await getSetting("STRIPE_SECRET_KEY");
  if (!key) return null;
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  if (!res.ok) throw new Error(`Stripe ${path} failed (${res.status}): ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

export async function createCheckoutSession(opts: {
  tenantId: string;
  email?: string;
  customerId?: string | null;
  base: string;
}): Promise<string | null> {
  const price = await getSetting("STRIPE_PRICE_ID");
  if (!price) return null;
  const params: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    client_reference_id: opts.tenantId,
    success_url: `${opts.base}/dashboard/settings?billing=success`,
    cancel_url: `${opts.base}/dashboard/settings?billing=cancel`,
  };
  if (opts.customerId) params.customer = opts.customerId;
  else if (opts.email) params.customer_email = opts.email;
  const json = await stripeForm("checkout/sessions", params);
  return (json?.url as string | undefined) ?? null;
}

export async function createPortalSession(customerId: string, base: string): Promise<string | null> {
  const json = await stripeForm("billing_portal/sessions", { customer: customerId, return_url: `${base}/dashboard/settings` });
  return (json?.url as string | undefined) ?? null;
}
