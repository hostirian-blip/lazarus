// POST /api/leads/import/preview — parse an uploaded file and return headers,
// a sample, row count, and a suggested column mapping. No DB writes.
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { previewContacts } from "@/lib/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const f = form?.get("file");
  if (!(f instanceof File)) return NextResponse.json({ error: "No file (field 'file')" }, { status: 400 });

  const buffer = Buffer.from(await f.arrayBuffer());
  try {
    return NextResponse.json({ ok: true, ...previewContacts(buffer) });
  } catch (e) {
    return NextResponse.json({ error: "Failed to parse file", detail: (e as Error).message }, { status: 422 });
  }
}
