// POST /api/internal/tick — the engine heartbeat. Called every minute by cron
// with the CRON_SECRET header. Processes due campaign sends.
import { NextResponse } from "next/server";
import { runDueSends } from "@/lib/engine/runner";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("x-cron-secret") !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const result = await runDueSends(200);
  return NextResponse.json({ ok: true, ...result });
}
