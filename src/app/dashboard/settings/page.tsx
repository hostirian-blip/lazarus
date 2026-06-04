// Per-tenant settings (customer CMS): brand/research + their own sending gateway.
import { requireSession, tenantDb } from "@/lib/tenant";
import { tenantSecretStatus } from "@/lib/settings/tenant-secrets";
import { db } from "@/lib/db";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";
import { FlashBanner } from "@/components/FlashBanner";
import { SettingsForm } from "./SettingsForm";
import { BillingButtons } from "./BillingButtons";
import { HubSpotConnect } from "./HubSpotConnect";

export const dynamic = "force-dynamic";

export default async function TenantSettings() {
  const session = await requireSession();
  const t = await tenantDb(session.user.tenantId).tenant();
  const secrets = await tenantSecretStatus(session.user.tenantId);
  const crm = await db.crmConnection.findUnique({
    where: { tenantId: session.user.tenantId },
    select: { provider: true, lastSyncedAt: true },
  });

  return (
    <AppShell
      nav={CLIENT_NAV}
      active="/dashboard/settings"
      user={{ name: t.name, email: session.user.email, role: "Workspace" }}
      breadcrumb="Workspace / Settings"
      title="Settings"
    >
      <FlashBanner />
      <div className="card" style={{ padding: 22, maxWidth: 620 }}>
        <SettingsForm
          initial={{
            brandVoice: t.brandVoice ?? "",
            emailSender: t.emailSender ?? "",
            twilioNumber: t.twilioNumber ?? "",
            researchEnabled: t.researchEnabled,
            researchRolloutPct: t.researchRolloutPct,
            researchMonthlyCapCents: t.researchMonthlyCap,
            twilioAccountSid: t.twilioAccountSid ?? "",
            smtpHost: t.smtpHost ?? "",
            smtpPort: t.smtpPort ?? 0,
            smtpUser: t.smtpUser ?? "",
          }}
          secrets={secrets}
        />
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 620, marginTop: 16 }}>
        <HubSpotConnect
          connected={crm?.provider === "hubspot"}
          lastSyncedAt={crm?.lastSyncedAt ? crm.lastSyncedAt.toISOString() : null}
        />
      </div>

      <div className="card" style={{ padding: 22, maxWidth: 620, marginTop: 16 }}>
        <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>Billing</h3>
        <BillingButtons status={t.subscriptionStatus ?? null} />
      </div>
    </AppShell>
  );
}
