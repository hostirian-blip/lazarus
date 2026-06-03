// Inbound email webhook (BUILD_PLAN step 7): provider posts replies here
// (e.g. SendGrid Inbound Parse). We log each reply as an OutreachEvent.
//
// TODO(claude-code): verify the provider's signature before trusting the payload.
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function extractEmail(raw: string): string | null {
  const m = raw.match(/<([^>]+)>/);
  const e = (m ? m[1] : raw).trim().toLowerCase();
  return e.includes("@") ? e : null;
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return new Response("ok");
  const from = extractEmail(String(form.get("from") ?? form.get("From") ?? ""));
  const text = String(form.get("text") ?? form.get("Body") ?? "");
  if (!from) return new Response("ok");

  const leads = await db.lead.findMany({ where: { email: from }, select: { id: true } });
  await Promise.all(
    leads.map((l) =>
      db.outreachEvent.create({ data: { leadId: l.id, channel: "email", direction: "inbound", body: text } }),
    ),
  );
  return new Response("ok");
}
