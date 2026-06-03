// Campaign CMS (customer-facing). Build re-nurture sequences of message templates.
import { requireSession, tenantDb } from "@/lib/tenant";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";
import { CampaignManager, type Campaign } from "./CampaignManager";

export const dynamic = "force-dynamic";

export default async function CampaignsPage() {
  const session = await requireSession();
  const campaigns = await tenantDb(session.user.tenantId).campaign.findMany({ orderBy: { createdAt: "desc" } });

  const initial: Campaign[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    active: c.active,
    sendMode: c.sendMode === "backoffice" ? "backoffice" : "internal",
    steps: Array.isArray(c.sequence) ? (c.sequence as unknown as Campaign["steps"]) : [],
  }));

  return (
    <AppShell
      nav={CLIENT_NAV}
      active="/dashboard/campaigns"
      user={{ email: session.user.email, role: "Workspace" }}
      breadcrumb="Workspace / Campaigns"
      title="Campaigns"
    >
      <p className="muted" style={{ maxWidth: 680, marginTop: 0 }}>
        Build re-nurture sequences. Each step has a channel, a delay, and a message template the
        re-nurture agent uses. The consent gate is still enforced at send time.
      </p>
      <CampaignManager initial={initial} />
    </AppShell>
  );
}
