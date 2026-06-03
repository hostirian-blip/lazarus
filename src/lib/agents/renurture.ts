import type { CrmLead } from "../connectors/types";
import type { ResearchBrief } from "./research";
import { getSetting } from "@/lib/settings/platform";

export interface DraftArgs {
  lead: CrmLead;
  channel: "sms" | "email";
  brief?: ResearchBrief;
  brandVoice: string;
}

export interface Draft {
  subject?: string;
  body: string;
}

/**
 * Generic, voice-neutral fallback message (control cohort, low-confidence research,
 * or no LLM key). Pure + deterministic so it's testable and always-available.
 * SMS includes the STOP footer for compliance.
 */
export function genericMessage(args: DraftArgs): Draft {
  const name = args.lead.firstName?.trim() || "there";
  if (args.channel === "sms") {
    return {
      body: `Hi ${name}, following up from a while back — are you still looking into this? Happy to share something useful. Reply STOP to opt out.`,
    };
  }
  return {
    subject: `Following up, ${name}`,
    body:
      `Hi ${name},\n\n` +
      `We were in touch a while ago and I wanted to reconnect. If this is still on your radar, ` +
      `I'd be glad to help you pick it back up.\n\n` +
      `Open to a quick call this week?\n\nThanks!`,
  };
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : "{}";
}

/**
 * Re-nurture agent. Uses the research brief (treatment cohort) to personalize via
 * the LLM; otherwise returns the generic message. Falls back to generic on any
 * LLM error so drafting never hard-fails a send pipeline.
 */
export async function draftMessage(args: DraftArgs): Promise<Draft> {
  const apiKey = await getSetting("ANTHROPIC_API_KEY");
  const usableBrief = args.brief && args.brief.summary.trim().length > 0;
  if (!apiKey || !usableBrief) return genericMessage(args);

  const channelRule =
    args.channel === "sms"
      ? "Keep it under 300 characters and end with 'Reply STOP to opt out.'"
      : "Provide a concise subject and a short body.";
  const prompt =
    `Write a ${args.channel} re-engagement message in this brand voice: "${args.brandVoice}". ` +
    `Personalize using this research brief: ${JSON.stringify(args.brief)}. ` +
    `Lead: ${JSON.stringify(args.lead)}. ${channelRule} ` +
    `Return ONLY JSON: {"subject"?:string,"body":string}.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: (await getSetting("ANTHROPIC_MODEL")) ?? "claude-3-5-haiku-latest",
        max_tokens: 400,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return genericMessage(args);
    const json = (await res.json()) as { content?: { text?: string }[] };
    const parsed = JSON.parse(extractJson(json.content?.[0]?.text ?? "{}")) as Partial<Draft>;
    if (!parsed.body) return genericMessage(args);
    return args.channel === "email" ? { subject: parsed.subject, body: parsed.body } : { body: parsed.body };
  } catch {
    return genericMessage(args);
  }
}
