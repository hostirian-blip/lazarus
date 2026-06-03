// Inbound Twilio SMS webhook (BUILD_PLAN steps 4 & 7): honor STOP/HELP/START and
// log inbound messages as OutreachEvents. Opt-out is GLOBAL for the phone number.
// Verifies X-Twilio-Signature against the platform auth token when configured;
// stays lenient only when no token is set (so dev/unconfigured flows still work).
import { db } from "@/lib/db";
import { classifyInbound } from "@/lib/consent/guard";
import { getSetting } from "@/lib/settings/platform";
import { verifyTwilioSignature } from "@/lib/webhooks/verify";

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

  const params: Record<string, string> = {};
  for (const [k, v] of form.entries()) if (typeof v === "string") params[k] = v;

  // Signature verification (only enforced when an auth token is configured).
  const authToken = await getSetting("TWILIO_AUTH_TOKEN");
  if (authToken) {
    const sig = req.headers.get("x-twilio-signature") ?? "";
    const url = `${process.env.NEXTAUTH_URL ?? ""}/api/webhooks/twilio`;
    if (!verifyTwilioSignature(authToken, url, params, sig)) {
      return new Response("invalid signature", { status: 403 });
    }
  }

  const from = (params.From ?? "").trim();
  const body = params.Body ?? "";
  if (!from) return twiml();

  const intent = classifyInbound(body);

  const leads = await db.lead.findMany({ where: { phoneE164: from }, select: { id: true } });
  await Promise.all(
    leads.map((l) =>
      db.outreachEvent.create({ data: { leadId: l.id, channel: "sms", direction: "inbound", body, meta: { intent } } }),
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
  return twiml();
}
