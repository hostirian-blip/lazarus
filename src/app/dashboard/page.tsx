// Client dashboard — Resurrection overview (app.html look, wired to real data).
import { requireSession, tenantDb } from "@/lib/tenant";
import { getDashboardData } from "@/lib/analytics/kpis";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";

export const dynamic = "force-dynamic";

const fmt = (n: number) => n.toLocaleString("en-US");
const cents = (n: number) => `$${(n / 100).toFixed(2)}`;
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default async function Dashboard() {
  const session = await requireSession();
  const scoped = tenantDb(session.user.tenantId);
  const [tenant, data] = await Promise.all([scoped.tenant(), getDashboardData(session.user.tenantId)]);
  const { overview: o, experiment: x, compliance: c, recent } = data;
  const tenReady = Boolean(tenant.twilioNumber);

  return (
    <AppShell
      nav={CLIENT_NAV}
      active="/dashboard"
      user={{ name: tenant.name, email: session.user.email, role: "Workspace" }}
      breadcrumb="Workspace / Dashboard"
      title="Resurrection overview"
      actions={<a className="btn btn-dark" href="/dashboard/import">Import more leads</a>}
    >
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 20 }}>
        <span className={"badge " + (tenant.researchEnabled ? "badge-green" : "badge-gold")}>{tenant.researchEnabled ? "Sending active" : "Sending paused"}</span>
        <span className="badge badge-gold">Research cohort: {tenant.researchRolloutPct}%</span>
        <span className={"badge " + (tenReady ? "badge-green" : "badge-gold")}>{tenReady ? "10DLC ready" : "10DLC pending"}</span>
      </div>

      <div className="kpi-grid" style={{ marginBottom: 14 }}>
        <Kpi label="Dead leads imported" v={fmt(o.imported)} />
        <Kpi label="Eligible for outreach" v={fmt(o.eligible)} />
        <Kpi label="Revived leads" v={fmt(o.revived)} color="var(--green)" />
        <Kpi label="Booked opportunities" v={fmt(o.booked)} color="var(--gold)" />
        <Kpi label="Replies" v={fmt(o.replies)} />
        <Kpi label="Research lift" v={`${o.bookingLiftPts >= 0 ? "+" : ""}${o.bookingLiftPts}pts`} color="var(--green)" />
        <Kpi label="Cost per revived" v={o.revived ? cents(o.costPerRevivedCents) : "—"} />
        <Kpi label="Consent blocked" v={fmt(o.consentBlocked)} color="var(--rust)" />
        <Kpi label="Revenue" v={cents(o.totalRevenueCents)} color="var(--gold)" />
      </div>

      <div className="cols-2">
        <div className="card" style={{ padding: 18 }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 16 }}>Recently revived</h3>
            <a className="muted" href="/dashboard/import" style={{ marginLeft: "auto", fontSize: 13 }}>Import more →</a>
          </div>
          {recent.length === 0 ? (
            <p className="muted" style={{ fontSize: 14 }}>No leads yet — import a CSV or connect HubSpot to begin.</p>
          ) : (
            recent.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderTop: i ? "1px solid var(--line-ink)" : "none" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--app-surface-2)", border: "1px solid var(--line-ink)", display: "grid", placeItems: "center", fontSize: 11, fontFamily: "var(--font-mono)", color: "var(--ink-dim)" }}>
                  {r.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{r.company}</div>
                </div>
                {r.tone !== "none" ? <span className={"badge badge-" + r.tone}>{r.status}</span> : <span className="label">{r.status}</span>}
              </div>
            ))
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>Research experiment</h3>
              <span className={"badge " + (tenant.researchEnabled ? "badge-green" : "badge-gold")} style={{ marginLeft: "auto" }}>{tenant.researchEnabled ? "Running" : "Off"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div className="label">Control</div>
                <div className="num" style={{ fontSize: 24 }}>{pct(x.control.bookingRate)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="label">Treatment</div>
                <div className="num" style={{ fontSize: 24, color: "var(--green)" }}>{pct(x.treatment.bookingRate)}</div>
              </div>
            </div>
            <Line label="Booking lift" v={`${x.bookingLift >= 0 ? "+" : ""}${Math.round(x.bookingLift * 1000) / 10}pts`} color="var(--gold)" />
            <Line label="Revenue / lead — treatment" v={cents(x.treatment.revenuePerLeadCents)} color="var(--green)" />
            <Line label="Revenue / lead — control" v={cents(x.control.revenuePerLeadCents)} />
            <Line label="Research cost / lead" v={cents(x.researchCostPerLeadCents)} />
            <Line label="Net ROI / lead" v={cents(x.netRoiPerLeadCents)} color={x.netRoiPerLeadCents >= 0 ? "var(--green)" : "var(--rust)"} />
            <Line label="Data" v={x.enoughData ? "Significant" : "Not enough yet"} />
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Compliance</h3>
            <Line label="SMS consent verified" badge={<span className="badge badge-green">{fmt(c.smsReady)} ready</span>} />
            <Line label="Missing email consent" badge={<span className="badge badge-gold">{fmt(c.missingEmail)}</span>} />
            <Line label="Opted out" badge={<span className="badge badge-rust">{fmt(c.optedOut)}</span>} />
            <Line label="10DLC registration" badge={<span className={"badge " + (tenReady ? "badge-green" : "badge-gold")}>{tenReady ? "Ready" : "Pending"}</span>} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function Kpi({ label, v, color }: { label: string; v: string; color?: string }) {
  return (
    <div className="kpi">
      <div className="label">{label}</div>
      <div className="v" style={{ color: color ?? "var(--ink)" }}>{v}</div>
    </div>
  );
}

function Line({ label, v, color, badge }: { label: string; v?: string; color?: string; badge?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--line-ink)" }}>
      <span style={{ fontSize: 13, color: "var(--ink-dim)" }}>{label}</span>
      <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontWeight: 600, color: color ?? "var(--ink)" }}>{badge ?? v}</span>
    </div>
  );
}
