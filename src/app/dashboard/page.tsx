// Protected, tenant-scoped dashboard with the split-test KPI panel (BUILD_PLAN step 8).
import type { CSSProperties } from "react";
import { requireSession, tenantDb } from "@/lib/tenant";
import { getDashboardKpis, type CohortStats } from "@/lib/analytics/kpis";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const cents = (n: number) => `$${(n / 100).toFixed(2)}`;

export default async function Dashboard() {
  const session = await requireSession();
  const scoped = tenantDb(session.user.tenantId);

  const [tenant, leadCount, campaignCount, kpis] = await Promise.all([
    scoped.tenant(),
    scoped.lead.count(),
    scoped.campaign.count(),
    getDashboardKpis(session.user.tenantId),
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
        <nav style={{ marginLeft: "auto", display: "flex", gap: 14, alignItems: "center" }}>
          <a href="/dashboard/campaigns" style={{ color: "#2563eb" }}>Campaigns</a>
          <a href="/dashboard/settings" style={{ color: "#2563eb" }}>Settings</a>
          <a
            href="/dashboard/import"
            style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", borderRadius: 8, textDecoration: "none" }}
          >
            Import leads
          </a>
        </nav>
      </section>

      {leadCount > 0 ? (
        <section style={{ marginTop: 32 }}>
          <h2 style={{ marginBottom: 8 }}>Research split-test — ROI</h2>
          {!kpis.enoughData && (
            <p style={{ background: "#fef9c3", border: "1px solid #fde047", padding: "10px 14px", borderRadius: 8, color: "#713f12" }}>
              Not enough data to call it yet — keep sending; lift below is directional until each cohort has a meaningful sample.
            </p>
          )}
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 8 }}>
            <thead>
              <tr style={{ textAlign: "left", color: "#666", fontSize: 14 }}>
                <th style={th}>Cohort</th>
                <th style={th}>Leads</th>
                <th style={th}>Researched</th>
                <th style={th}>Cost / researched</th>
                <th style={th}>Reply rate</th>
                <th style={th}>Booking rate</th>
              </tr>
            </thead>
            <tbody>
              <Row label="Treatment (research on)" s={kpis.treatment} />
              <Row label="Control (research off)" s={kpis.control} />
            </tbody>
          </table>

          <div style={{ display: "flex", gap: 16, marginTop: 16 }}>
            <Lift label="Reply lift" value={kpis.replyLift} />
            <Lift label="Booking lift" value={kpis.bookingLift} />
            <Stat label="Research spend" value={cents(kpis.treatment.costCents)} />
          </div>
          <p style={{ color: "#999", fontSize: 13, marginTop: 12 }}>
            Net lift is treatment minus control. Revenue/lead lands once a revenue field is captured (TODO).
          </p>
        </section>
      ) : (
        <section style={{ marginTop: 24, padding: 24, border: "1px dashed #ccc", borderRadius: 10, background: "#fafafa" }}>
          <h2 style={{ marginTop: 0 }}>No leads yet</h2>
          <p style={{ color: "#555" }}>
            Your workspace is ready. Next:{" "}
            <a href="/dashboard/import" style={{ color: "#2563eb" }}>import your dead leads (CSV/XLSX)</a>{" "}
            or{" "}
            <a href="/api/connectors/hubspot/start" style={{ color: "#2563eb" }}>connect HubSpot</a>.
          </p>
        </section>
      )}
    </main>
  );
}

const th: CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #eee" };
const td: CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f3f4f6" };

function Row({ label, s }: { label: string; s: CohortStats }) {
  return (
    <tr>
      <td style={td}>{label}</td>
      <td style={td}>{s.leads}</td>
      <td style={td}>{s.researched}</td>
      <td style={td}>{s.researched ? cents(s.costPerResearchedCents) : "—"}</td>
      <td style={td}>{pct(s.replyRate)}</td>
      <td style={td}>{pct(s.bookingRate)}</td>
    </tr>
  );
}

function Lift({ label, value }: { label: string; value: number }) {
  const positive = value >= 0;
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 10, minWidth: 140 }}>
      <div style={{ fontSize: 24, fontWeight: 700, color: positive ? "#15803d" : "#b91c1c" }}>
        {positive ? "+" : ""}
        {(value * 100).toFixed(1)} pts
      </div>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 10, minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
    </div>
  );
}
