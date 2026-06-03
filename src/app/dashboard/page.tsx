// Protected, tenant-scoped dashboard.
// Step 1 done-when: a new user creates a Tenant and lands on an empty dashboard;
// no query crosses tenants. Data here is read exclusively through tenantDb().
//
// TODO(claude-code): BUILD_PLAN step 8 — replace the empty state with the
// split-test KPI panel (cost/researched lead, reply/booking rate, net lift).
import { requireSession, tenantDb } from "@/lib/tenant";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await requireSession();
  const scoped = tenantDb(session.user.tenantId);

  const [tenant, leadCount, campaignCount] = await Promise.all([
    scoped.tenant(),
    scoped.lead.count(),
    scoped.campaign.count(),
  ]);

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>{tenant.name}</h1>
          <p style={{ margin: 0, color: "#666" }}>Signed in as {session.user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <section style={{ display: "flex", gap: 16, marginTop: 24, alignItems: "center" }}>
        <Stat label="Leads" value={leadCount} />
        <Stat label="Campaigns" value={campaignCount} />
        <a
          href="/dashboard/import"
          style={{
            marginLeft: "auto",
            padding: "10px 16px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Import leads
        </a>
      </section>

      {leadCount === 0 && (
        <section
          style={{
            marginTop: 24,
            padding: 24,
            border: "1px dashed #ccc",
            borderRadius: 10,
            background: "#fafafa",
          }}
        >
          <h2 style={{ marginTop: 0 }}>No leads yet</h2>
          <p style={{ color: "#555" }}>
            Your workspace is ready. Next:{" "}
            <a href="/dashboard/import" style={{ color: "#2563eb" }}>
              import your dead leads (CSV/XLSX)
            </a>{" "}
            or{" "}
            <a href="/api/connectors/hubspot/start" style={{ color: "#2563eb" }}>
              connect HubSpot
            </a>
            .
          </p>
          <p style={{ color: "#999", fontSize: 14, margin: 0 }}>
            (CRM connect arrives in BUILD_PLAN step 3.)
          </p>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 10, minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
    </div>
  );
}
