import { Brand } from "@/components/Brand";
import { SiteNav } from "@/components/SiteNav";
import { Faq } from "@/components/Faq";

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
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{name}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{co}</div>
      </div>
      {badge}
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="card feature-card">
      <div className="num gold" style={{ fontSize: 13, letterSpacing: "0.1em" }}>{n}</div>
      <h3 style={{ fontSize: 19, fontWeight: 700, margin: "12px 0 8px" }}>{title}</h3>
      <p className="muted" style={{ fontSize: 15, margin: 0, lineHeight: 1.55 }}>{body}</p>
    </div>
  );
}

function Check({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "9px 0" }}>
      <span aria-hidden style={{ color: "var(--green)", fontWeight: 800, lineHeight: 1.5 }}>✓</span>
      <span style={{ fontSize: 15, lineHeight: 1.55 }}>{children}</span>
    </li>
  );
}

export default function Home() {
  return (
    <div className="landing">
      <SiteNav />

      <div className="landing-wrap">
        {/* Hero */}
        <section className="hero-grid" style={{ padding: "52px 0 64px" }}>
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
            <div className="hero-cta" style={{ display: "flex", gap: 14, marginTop: 30, flexWrap: "wrap" }}>
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

        {/* How it works */}
        <section id="how" className="section">
          <div className="section-head">
            <div className="kicker">How it works</div>
            <h2 className="section-title">From graveyard to pipeline in three moves.</h2>
            <p className="muted" style={{ fontSize: 17, marginTop: 12 }}>
              No new database to fill. Lazarus works the leads you already have.
            </p>
          </div>
          <div className="feature-grid">
            <Step n="01" title="Connect your CRM" body="Sync dead and cold contacts straight from HubSpot, or import a CSV. Consent status is mapped on the way in — nothing gets contacted without it." />
            <Step n="02" title="Fire compliant outreach" body="AI personalizes SMS and email per contact and sends through your gateway or ours. Opt-outs, quiet hours, and STOP are enforced automatically." />
            <Step n="03" title="Track real revenue" body="Every reply, booked call, and closed deal ties back to the lead it revived — so you see pipeline created, not vanity opens." />
          </div>
        </section>

        {/* Compliance */}
        <section id="compliance" className="section">
          <div className="cols-2" style={{ alignItems: "center" }}>
            <div className="section-head">
              <div className="kicker" style={{ color: "var(--green)" }}>Compliance</div>
              <h2 className="section-title">Consent-first, or it doesn&apos;t send.</h2>
              <p className="muted" style={{ fontSize: 17, marginTop: 12 }}>
                Re-engaging old leads is only worth it if it&apos;s clean. Compliance isn&apos;t a setting
                you can turn off — it&apos;s the gate every message passes through.
              </p>
            </div>
            <div className="card" style={{ padding: 22 }}>
              <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
                <Check>Explicit SMS &amp; email consent checked before every single send.</Check>
                <Check>Automatic STOP / unsubscribe handling, honored instantly across channels.</Check>
                <Check>Quiet-hours windows so you never text someone at 2&nbsp;a.m.</Check>
                <Check>A per-message audit trail: who consented, when, and through what source.</Check>
              </ul>
              <div className="kicker" style={{ color: "var(--green)", marginTop: 14 }}>No consent, no send.</div>
            </div>
          </div>
        </section>

        {/* Research ROI */}
        <section id="roi" className="section">
          <div className="section-head">
            <div className="kicker" style={{ color: "var(--gold-2)" }}>Research ROI</div>
            <h2 className="section-title">Prove it&apos;s incremental, not coincidental.</h2>
            <p className="muted" style={{ fontSize: 17, marginTop: 12, maxWidth: 620 }}>
              Lazarus holds back a control group automatically, so you can see the revenue your outreach
              actually <em>caused</em> — with a monthly research budget cap you set.
            </p>
          </div>
          <div className="feature-grid" style={{ marginTop: 28 }}>
            <div className="card feature-card">
              <div className="label">Revenue lift / lead</div>
              <div className="num" style={{ fontSize: 30, marginTop: 8, color: "var(--green)" }}>+$14.98</div>
              <p className="muted" style={{ fontSize: 14, marginTop: 8, margin: "8px 0 0" }}>Treatment vs. held-out control — net of research cost.</p>
            </div>
            <div className="card feature-card">
              <div className="label">Booking lift</div>
              <div className="num" style={{ fontSize: 30, marginTop: 8, color: "var(--gold-2)" }}>+15%</div>
              <p className="muted" style={{ fontSize: 14, marginTop: 8, margin: "8px 0 0" }}>More booked calls than the leads you left untouched.</p>
            </div>
            <div className="card feature-card">
              <div className="label">Research cost / lead</div>
              <div className="num" style={{ fontSize: 30, marginTop: 8 }}>$0.02</div>
              <p className="muted" style={{ fontSize: 14, marginTop: 8, margin: "8px 0 0" }}>Capped monthly — the experiment never outspends its payoff.</p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="section">
          <div className="section-head">
            <div className="kicker">FAQ</div>
            <h2 className="section-title">Questions, answered.</h2>
          </div>
          <Faq />
        </section>

        {/* Closing CTA */}
        <section className="section cta-band">
          <h2 className="section-title" style={{ maxWidth: 680 }}>Stop paying for leads twice. Resurrect the ones you have.</h2>
          <div className="hero-cta" style={{ display: "flex", gap: 14, marginTop: 24, flexWrap: "wrap" }}>
            <a className="btn btn-gold" href="/signup">Start resurrecting leads</a>
            <a className="btn btn-ghost" href="/login">Log in</a>
          </div>
        </section>

        <footer className="site-footer">
          <Brand size={18} />
          <span className="kicker" style={{ color: "var(--green)" }}>No consent, no send.</span>
        </footer>
      </div>
    </div>
  );
}
