// POST /api/billing/checkout — create a Stripe Checkout session for the tenant.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createCheckoutSession } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenant = await db.tenant.findUnique({ where: { id: session.user.tenantId } });
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  try {
    const url = await createCheckoutSession({
      tenantId: session.user.tenantId,
      email: session.user.email ?? undefined,
      customerId: tenant?.stripeCustomerId,
      base,
    });
    if (!url) return NextResponse.json({ error: "Billing is not configured" }, { status: 501 });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: "Checkout failed", detail: (e as Error).message }, { status: 502 });
  }
}
