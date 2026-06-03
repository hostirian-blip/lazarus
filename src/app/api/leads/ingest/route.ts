// POST /api/leads/ingest — multipart upload of a CSV/XLSX of contacts.
// Tenant-scoped; returns a summary { created, duplicatesInFile, duplicatesExisting, invalid }.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { tenantDb } from "@/lib/tenant";
import { ingestContacts } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // needs Buffer + xlsx (not Edge-compatible)

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let file: File | null = null;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (f instanceof File) file = f;
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a 'file' field" },
      { status: 400 },
    );
  }
  if (!file) {
    return NextResponse.json({ error: "No file uploaded (field 'file')" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const result = await ingestContacts(tenantDb(session.user.tenantId), buffer);
    return NextResponse.json({ ok: true, file: file.name, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: "Failed to parse file", detail: (e as Error).message },
      { status: 422 },
    );
  }
}
