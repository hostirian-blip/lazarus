// Shared dark hero panel for the split auth screens.
import { Brand } from "./Brand";

function Stat({ n, l, color }: { n: string; l: string; color?: string }) {
  return (
    <div>
      <div className="num" style={{ fontSize: 30, color: color ?? "var(--text)" }}>{n}</div>
      <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", marginTop: 4 }}>{l}</div>
    </div>
  );
}

export function AuthHero() {
  return (
    <div className="auth-hero">
      <a href="/"><Brand /></a>
      <div style={{ marginTop: "auto" }}>
        <div className="kicker">Lead Resurrection Platform</div>
        <h1 className="display" style={{ fontSize: "clamp(38px, 4.6vw, 60px)", marginTop: 18 }}>
          Your dead leads aren&apos;t dead.
          <br />
          <span className="gold">They&apos;re money you left behind.</span>
        </h1>
        <p className="muted" style={{ maxWidth: 440, marginTop: 18 }}>
          Import the old contacts buried in your CRM, fire compliant personalized outreach, and
          track which dead leads turn back into revenue.
        </p>
        <div style={{ display: "flex", gap: 40, marginTop: 34, flexWrap: "wrap" }}>
          <Stat n="3,184" l="Leads revived" color="var(--green)" />
          <Stat n="$2.1M" l="Pipeline resurrected" color="var(--gold-2)" />
          <Stat n="$3.40" l="Cost per revived" />
        </div>
      </div>
      <div className="kicker" style={{ marginTop: 36, color: "var(--green)" }}>No consent, no send.</div>
    </div>
  );
}
