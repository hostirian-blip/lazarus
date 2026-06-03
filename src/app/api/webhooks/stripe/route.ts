// POST /api/webhooks/stripe — verify the signature and update subscription state.
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings/platform";
import { verifyStripeSignature } from "@/lib/webhooks/verify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const payload = await req.text();
  const secret = await getSetting("STRIPE_WEBHOOK_SECRET");
  if (secret) {
    const sig = req.headers.get("stripe-signature") ?? "";
    if (!verifyStripeSignature(payload, sig, secret)) {
      return NextResponse.json({ error: "invalid signature" }, { status: 400 });
    }
  }

  let event: { type?: string; data?: { object?: Record<string, unknown> } };
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "bad payload" }, { status: 400 });
  }
  const obj = event.data?.object ?? {};

  if (event.type === "checkout.session.completed") {
    const tenantId = obj.client_reference_id as string | undefined;
    const customer = obj.customer as string | undefined;
    if (tenantId) {
      await db.tenant
        .update({ where: { id: tenantId }, data: { stripeCustomerId: customer ?? undefined, subscriptionStatus: "active" } })
        .catch(() => {});
    }
  } else if (event.type?.startsWith("customer.subscription.")) {
    const customer = obj.customer as string | undefined;
    const status = (obj.status as string | undefined) ?? "unknown";
    if (customer) {
      await db.tenant.updateMany({ where: { stripeCustomerId: customer }, data: { subscriptionStatus: status } });
    }
  }

  return NextResponse.json({ received: true });
}
