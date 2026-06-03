// POST /api/leads/import/commit — ingest with an explicit mapping + consent.
// multipart: file, mapping (JSON), consentSource, smsConsent, emailConsent, dryRun.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { ingestContacts, type FieldMapping } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
  const f = form.get("file");
  if (!(f instanceof File)) return NextResponse.json({ error: "No file (field 'file')" }, { status: 400 });

  let mapping: FieldMapping = {};
  try {
    mapping = JSON.parse(String(form.get("mapping") ?? "{}"));
  } catch {
    return NextResponse.json({ error: "Invalid mapping JSON" }, { status: 400 });
  }
  const consentSource = String(form.get("consentSource") ?? "").trim() || undefined;
  const smsConsent = form.get("smsConsent") === "true";
  const emailConsent = form.get("emailConsent") === "true";
  const dryRun = form.get("dryRun") === "true";

  const buffer = Buffer.from(await f.arrayBuffer());
  try {
    const result = await ingestContacts(tenantDb(session.user.tenantId), buffer, {
      mapping,
      consentSource,
      smsConsent,
      emailConsent,
      dryRun,
    });
    return NextResponse.json({ ok: true, dryRun, ...result });
  } catch (e) {
    return NextResponse.json({ error: "Import failed", detail: (e as Error).message }, { status: 422 });
  }
}
