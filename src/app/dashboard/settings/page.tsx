// Per-tenant settings (customer CMS).
import { requireSession, tenantDb } from "@/lib/tenant";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function TenantSettings() {
  const session = await requireSession();
  const t = await tenantDb(session.user.tenantId).tenant();

  return (
    <AppShell
      nav={CLIENT_NAV}
      active="/dashboard/settings"
      user={{ name: t.name, email: session.user.email, role: "Workspace" }}
      breadcrumb="Workspace / Settings"
      title="Settings"
    >
      <div className="card" style={{ padding: 22, maxWidth: 620 }}>
        <SettingsForm
          initial={{
            brandVoice: t.brandVoice ?? "",
            emailSender: t.emailSender ?? "",
            twilioNumber: t.twilioNumber ?? "",
            researchEnabled: t.researchEnabled,
            researchRolloutPct: t.researchRolloutPct,
            researchMonthlyCapCents: t.researchMonthlyCap,
          }}
        />
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 620, marginTop: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>CRM connection</h3>
        <p className="muted" style={{ fontSize: 14 }}>Connect HubSpot to import leads and write activity back.</p>
        <a className="btn btn-gold" href="/api/connectors/hubspot/start">Connect HubSpot</a>
      </div>
    </AppShell>
  );
}
