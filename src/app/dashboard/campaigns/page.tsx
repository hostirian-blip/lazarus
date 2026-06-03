// Campaign CMS (customer-facing). Build re-nurture sequences of message templates.
import { requireSession, tenantDb } from "@/lib/tenant";
import { CampaignManager, type Campaign } from "./CampaignManager";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await requireSession();
  const campaigns = await tenantDb(session.user.tenantId).campaign.findMany({ orderBy: { createdAt: "desc" } });

  const initial: Campaign[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
    steps: Array.isArray(c.sequence) ? (c.sequence as unknown as Campaign["steps"]) : [],
  }));

  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: 32 }}>
      <p style={{ marginBottom: 4 }}>
        <a href="/dashboard" style={{ color: "#2563eb" }}>← Dashboard</a>
      </p>
      <h1>Campaigns</h1>
      <p style={{ color: "#555" }}>
        Build re-nurture sequences. Each step has a channel, a delay, and a message template the
        re-nurture agent uses. The consent gate is still enforced at send time.
      </p>
      <CampaignManager initial={initial} />
    </main>
  );
}
