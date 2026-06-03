import type { CrmLead } from "../connectors/types";

export interface ResearchBrief {
  summary: string; // who they are
  whatsChanged: string; // recent signal worth referencing
  hook: string; // opening angle
  confidence: number; // 0-1 entity-match confidence
  costCents: number;
}

// Below this entity-match confidence, do NOT personalize — fall back to generic.
// Wrong-person personalization is worse than none.
export const ENTITY_CONFIDENCE_THRESHOLD = 0.7;

/**
 * Gate that decides whether to spend research on a lead. Pure + testable.
 * Order: feature flag -> cohort -> cap set -> within monthly cap.
 */
export function researchDecision(opts: {
  enabled: boolean;
  cohort: "treatment" | "control";
  monthlyCapCents: number; // 0 = research disabled by cap
  spentThisMonthCents: number;
  estCostCents?: number;
}): { run: boolean; reason: string } {
  if (!opts.enabled) return { run: false, reason: "research_disabled" };
  if (opts.cohort !== "treatment") return { run: false, reason: "control_cohort" };
  if (opts.monthlyCapCents <= 0) return { run: false, reason: "no_cap_set" };
  const est = opts.estCostCents ?? 0;
  if (opts.spentThisMonthCents + est > opts.monthlyCapCents) return { run: false, reason: "cap_reached" };
  return { run: true, reason: "ok" };
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  return start >= 0 && end > start ? text.slice(start, end + 1) : "{}";
}

// Rough cost estimate from Anthropic token usage (Haiku-class pricing). Real
// per-model pricing is a TODO once the model is pinned.
function estimateCostCents(usage?: { input_tokens?: number; output_tokens?: number }): number {
  if (!usage) return 0;
  const inK = (usage.input_tokens ?? 0) / 1000;
  const outK = (usage.output_tokens ?? 0) / 1000;
  return Math.ceil(inK * 0.08 + outK * 0.4); // cents
}

/**
 * Enrich a single lead into a personalization brief via the LLM.
 * Without ANTHROPIC_API_KEY (or real enrichment data) it returns confidence 0 so
 * the caller falls back to a generic message — never a confident guess.
 *
 * TODO(claude-code): enrich with web search + a data provider (Apollo/PDL/Clearbit)
 * BEFORE this call so the model reasons over real signal, not just CRM fields.
 */
export async function researchLead(lead: CrmLead): Promise<ResearchBrief> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const empty: ResearchBrief = { summary: "", whatsChanged: "", hook: "", confidence: 0, costCents: 0 };
  if (!apiKey) return empty;

  const prompt =
    "You are a B2B sales-research assistant. Given a lead, produce a short personalization brief. " +
    "Return ONLY JSON: {\"summary\":string,\"whatsChanged\":string,\"hook\":string,\"confidence\":number}. " +
    "confidence is 0-1 for how sure you are this is the specific real person/company. If you cannot " +
    "confidently identify them from the given data, set confidence below 0.5 and keep fields generic.\n\n" +
    `Lead: ${JSON.stringify(lead)}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`research LLM failed (${res.status}): ${await res.text()}`);
  const json = (await res.json()) as {
    content?: { text?: string }[];
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  const text = json.content?.[0]?.text ?? "{}";
  let parsed: Partial<ResearchBrief> = {};
  try {
    parsed = JSON.parse(extractJson(text)) as Partial<ResearchBrief>;
  } catch {
    parsed = {};
  }
  return {
    summary: parsed.summary ?? "",
    whatsChanged: parsed.whatsChanged ?? "",
    hook: parsed.hook ?? "",
    confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0,
    costCents: estimateCostCents(json.usage),
  };
}
