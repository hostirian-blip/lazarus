// One-click email unsubscribe (CAN-SPAM). GET so it works directly from an email
// link. The signed token authorizes the opt-out without a login session.
import { db } from "@/lib/db";
import { verifyUnsubscribeToken } from "@/lib/consent/unsubscribe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function html(message: string, status = 200): Response {
  return new Response(
    `<!doctype html><meta charset="utf-8"><title>Lazarus</title>` +
      `<body style="font-family:system-ui,sans-serif;max-width:480px;margin:64px auto;padding:0 16px">` +
      `<h1>Lazarus</h1><p>${message}</p></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead") ?? "";
  const token = url.searchParams.get("t") ?? "";

  if (!verifyUnsubscribeToken(leadId, token)) {
    return html("This unsubscribe link is invalid or has expired.", 400);
  }

  await db.lead
    .update({ where: { id: leadId }, data: { optedOut: true, emailConsent: false } })
    .catch(() => null); // already-removed lead: still show success (idempotent)

  return html("You've been unsubscribed from these emails. You won't receive any more.");
}
