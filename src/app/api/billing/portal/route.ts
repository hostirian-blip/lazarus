// POST /api/billing/portal — open the Stripe billing portal for the tenant.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createPortalSession } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const tenant = await db.tenant.findUnique({ where: { id: session.user.tenantId } });
  if (!tenant?.stripeCustomerId) return NextResponse.json({ error: "No billing account yet — subscribe first." }, { status: 409 });
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  try {
    const url = await createPortalSession(tenant.stripeCustomerId, base);
    if (!url) return NextResponse.json({ error: "Billing is not configured" }, { status: 501 });
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: "Portal failed", detail: (e as Error).message }, { status: 502 });
  }
}
