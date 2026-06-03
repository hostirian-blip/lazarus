// POST /api/tenant/secrets — set the caller tenant's own sending secrets
// (Twilio auth token, SMTP password). Encrypted at rest; blanks ignored.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { TENANT_SECRET_KEYS, setTenantSecret } from "@/lib/settings/tenant-secrets";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set<string>(TENANT_SECRET_KEYS);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { values?: Record<string, string> } | null;
  const values = body?.values ?? {};
  const updated: string[] = [];
  for (const [k, v] of Object.entries(values)) {
    if (!ALLOWED.has(k) || typeof v !== "string" || v.trim() === "") continue;
    await setTenantSecret(session.user.tenantId, k, v.trim());
    updated.push(k);
  }
  return NextResponse.json({ ok: true, updated });
}
