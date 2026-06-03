// Inbound Twilio SMS webhook (BUILD_PLAN steps 4 & 7): honor STOP/HELP/START and
// log inbound messages as OutreachEvents. Opt-out is GLOBAL for the phone number —
// a person who texts STOP must never be messaged again, in any tenant.
//
// TODO(claude-code): validate the X-Twilio-Signature header with TWILIO_AUTH_TOKEN
// before trusting this payload (requires the credential).
import { db } from "@/lib/db";
import { classifyInbound } from "@/lib/consent/guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function twiml(message?: string): Response {
  const inner = message ? `<Message>${message}</Message>` : "";
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`;
  return new Response(body, { headers: { "Content-Type": "text/xml" } });
}

export async function POST(req: Request) {
  const form = await req.formData().catch(() => null);
  if (!form) return twiml();
  const from = String(form.get("From") ?? "").trim();
  const body = String(form.get("Body") ?? "");
  if (!from) return twiml();

  const intent = classifyInbound(body);

  // Record the inbound message against every lead with this phone (across tenants).
  const leads = await db.lead.findMany({ where: { phoneE164: from }, select: { id: true } });
  await Promise.all(
    leads.map((l) =>
      db.outreachEvent.create({
        data: { leadId: l.id, channel: "sms", direction: "inbound", body, meta: { intent } },
      }),
    ),
  );

  if (intent === "stop") {
    await db.lead.updateMany({ where: { phoneE164: from }, data: { optedOut: true, smsConsent: false } });
    return twiml("You've been unsubscribed and won't receive more messages. Reply START to opt back in.");
  }
  if (intent === "start") {
    await db.lead.updateMany({ where: { phoneE164: from }, data: { optedOut: false, smsConsent: true } });
    return twiml("You're opted back in. Reply STOP to unsubscribe at any time.");
  }
  if (intent === "help") {
    return twiml("Lazarus outreach. Reply STOP to unsubscribe. Msg & data rates may apply.");
  }
  // Normal reply: logged above; conversational reply handling arrives in step 7.
  return twiml();
}
