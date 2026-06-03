// Per-tenant settings (customer CMS). Brand voice, channels, research controls,
// plus CRM connection.
import { requireSession, tenantDb } from "@/lib/tenant";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function TenantSettings() {
  const session = await requireSession();
  const t = await tenantDb(session.user.tenantId).tenant();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <p style={{ marginBottom: 4 }}>
        <a href="/dashboard" style={{ color: "#2563eb" }}>← Dashboard</a>
      </p>
      <h1>Settings</h1>

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

      <section style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #eee" }}>
        <h2 style={{ marginBottom: 8 }}>CRM connection</h2>
        <p style={{ color: "#555" }}>Connect HubSpot to import leads and write activity back.</p>
        <a href="/api/connectors/hubspot/start" style={{ display: "inline-block", padding: "10px 16px", background: "#ff7a59", color: "#fff", borderRadius: 8, textDecoration: "none" }}>
          Connect HubSpot
        </a>
      </section>
    </main>
  );
}
