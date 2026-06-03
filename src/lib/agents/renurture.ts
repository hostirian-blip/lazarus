import type { CrmLead } from "../connectors/types";
import type { ResearchBrief } from "./research";

// Re-nurture agent — drafts the SMS/email in the tenant's brand voice.
// Consumes the research brief when present (treatment cohort); falls back to a
// solid generic message for the control cohort or low-confidence research.
export async function draftMessage(args: {
  lead: CrmLead;
  channel: "sms" | "email";
  brief?: ResearchBrief;
  brandVoice: string;
}): Promise<{ subject?: string; body: string }> {
  throw new Error("not implemented: draftMessage");
}
