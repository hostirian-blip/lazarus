// POST /api/admin/settings — admin-only. Body: { values: { KEY: "newSecret", ... } }.
// Blank/absent values are ignored (so you don't have to re-enter unchanged secrets).
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PLATFORM_KEYS, setSetting } from "@/lib/settings/platform";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED = new Set(PLATFORM_KEYS.map((k) => k.key));

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { values?: Record<string, string> } | null;
  const values = body?.values ?? {};
  const updated: string[] = [];
  for (const [key, val] of Object.entries(values)) {
    if (!ALLOWED.has(key)) continue;
    if (typeof val !== "string" || val.trim() === "") continue; // skip blanks
    await setSetting(key, val.trim());
    updated.push(key);
  }
  return NextResponse.json({ ok: true, updated });
}
