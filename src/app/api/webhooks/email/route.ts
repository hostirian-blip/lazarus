// Inbound email webhook (BUILD_PLAN step 7): provider posts replies here
// (e.g. SendGrid Inbound Parse). Logs each reply as an OutreachEvent. Inbound
// Parse has no native signature, so we gate on a shared secret (?key= or
// x-webhook-secret header) when EMAIL_WEBHOOK_SECRET is configured.
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings/platform";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractEmail(raw: string): string | null {
  const m = raw.match(/<([^>]+)>/);
  const e = (m ? m[1] : raw).trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export async function POST(req: Request) {
  const secret = await getSetting("EMAIL_WEBHOOK_SECRET");
  if (secret) {
    const provided = new URL(req.url).searchParams.get("key") ?? req.headers.get("x-webhook-secret") ?? "";
    if (provided !== secret) return new Response("forbidden", { status: 403 });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return new Response("ok");
  const from = extractEmail(String(form.get("from") ?? form.get("From") ?? ""));
  const text = String(form.get("text") ?? form.get("Body") ?? "");
  if (!from) return new Response("ok");

  const leads = await db.lead.findMany({ where: { email: from }, select: { id: true } });
  await Promise.all(
    leads.map((l) => db.outreachEvent.create({ data: { leadId: l.id, channel: "email", direction: "inbound", body: text } })),
  );
  return new Response("ok");
}
