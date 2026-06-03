import { Brand } from "@/components/Brand";

function Stat({ n, l, color }: { n: string; l: string; color?: string }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 26, color: color ?? "var(--text)" }}>{n}</div>
      <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{l}</div>
    </div>
  );
}

function Mini({ label, v, color }: { label: string; v: string; color?: string }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: "12px 14px" }}>
      <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--text-dim)" }}>{label}</div>
      <div className="num" style={{ fontSize: 22, marginTop: 6, color: color ?? "var(--text)" }}>{v}</div>
    </div>
  );
}

function Row({ name, co, badge }: { name: string; co: string; badge: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0" }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
        {name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{co}</div>
      </div>
      {badge}
    </div>
  );
}

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "radial-gradient(120% 80% at 78% -10%, #241b12 0%, var(--bg) 55%)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px" }}>
        <nav style={{ display: "flex", alignItems: "center", gap: 28, padding: "22px 0" }}>
          <a href="/"><Brand /></a>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 20 }}>
            <a className="muted" href="#how" style={{ fontSize: 14 }}>How it works</a>
            <a className="muted" href="#compliance" style={{ fontSize: 14 }}>Compliance</a>
            <a className="muted" href="#roi" style={{ fontSize: 14 }}>Research ROI</a>
            <a className="btn btn-ghost" href="/login" style={{ padding: "9px 16px" }}>Log in</a>
            <a className="btn btn-gold" href="/signup" style={{ padding: "9px 16px" }}>Start resurrecting</a>
          </div>
        </nav>

        <section style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 48, alignItems: "center", padding: "44px 0 64px" }}>
          <div>
            <div className="kicker">Lead Resurrection Platform</div>
            <h1 className="display" style={{ marginTop: 18 }}>
              Your dead leads aren&apos;t dead.
              <br />
              <span className="gold">They&apos;re money you left behind.</span>
            </h1>
            <p className="muted" style={{ fontSize: 18, maxWidth: 520, marginTop: 22 }}>
              Every CRM is a graveyard of leads you already paid for. Lazarus syncs those dead
              contacts, fires compliant personalized outreach, and tracks exactly which ones turn back
              into replies, booked calls, and revenue.
            </p>
            <div style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
              <a className="btn btn-gold" href="/signup">Start resurrecting leads</a>
              <a className="btn btn-ghost" href="/login">See it in action →</a>
            </div>
            <div style={{ display: "flex", gap: 40, marginTop: 40, flexWrap: "wrap" }}>
              <Stat n="41,200" l="Dead leads imported" />
              <Stat n="3,184" l="Revived" color="var(--green)" />
              <Stat n="$2.1M" l="Pipeline" color="var(--gold-2)" />
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <div className="num muted" style={{ fontSize: 12 }}>app.lazarus.io / dashboard</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 14 }}>
              <Mini label="Eligible" v="12,840" />
              <Mini label="Revived" v="3,184" color="var(--green)" />
              <Mini label="Booked" v="214" color="var(--gold-2)" />
            </div>
            <div style={{ marginTop: 16, borderTop: "1px solid var(--line)", paddingTop: 6 }}>
              <Row name="Dana Whitfield" co="Northwind Roofing" badge={<span className="badge badge-green">Revived</span>} />
              <Row name="Marcus Lao" co="Apex Dental" badge={<span className="badge badge-green">Revived</span>} />
              <Row name="Priya N" co="Cedar HVAC" badge={<span className="badge badge-gold">SMS consent</span>} />
            </div>
          </div>
        </section>

        <footer style={{ borderTop: "1px solid var(--line)", padding: "24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Brand size={18} />
          <span className="kicker" style={{ color: "var(--green)" }}>No consent, no send.</span>
        </footer>
      </div>
    </div>
  );
}
