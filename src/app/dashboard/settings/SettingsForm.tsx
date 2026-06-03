"use client";
import type { CSSProperties } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface TenantSettings {
  brandVoice: string;
  emailSender: string;
  twilioNumber: string;
  researchEnabled: boolean;
  researchRolloutPct: number;
  researchMonthlyCapCents: number;
  twilioAccountSid: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
}
export interface SecretStatus {
  TWILIO_AUTH_TOKEN: boolean;
  SMTP_PASS: boolean;
}

const inputStyle: CSSProperties = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 };
const labelStyle: CSSProperties = { display: "block", fontWeight: 600, marginBottom: 4, fontSize: 14 };
const sectionH: CSSProperties = { margin: "22px 0 12px", fontSize: 15 };

function status(set: boolean) {
  return <span style={{ fontWeight: 400, fontSize: 12, color: set ? "#15803d" : "#9ca3af" }}>{set ? "• set" : "• not set"}</span>;
}

export function SettingsForm({ initial, secrets }: { initial: TenantSettings; secrets: SecretStatus }) {
  const router = useRouter();
  const [s, setS] = useState<TenantSettings>(initial);
  const [authToken, setAuthToken] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function set<K extends keyof TenantSettings>(k: K, v: TenantSettings[K]) {
    setS((p) => ({ ...p, [k]: v }));
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tenant/settings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(s) });
      const secretVals: Record<string, string> = {};
      if (authToken.trim()) secretVals.TWILIO_AUTH_TOKEN = authToken.trim();
      if (smtpPass.trim()) secretVals.SMTP_PASS = smtpPass.trim();
      if (Object.keys(secretVals).length) {
        await fetch("/api/tenant/secrets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ values: secretVals }) });
      }
      setMsg(res.ok ? "Saved." : "Save failed");
      if (res.ok) {
        setAuthToken("");
        setSmtpPass("");
        router.refresh();
      }
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h3 style={{ marginTop: 0, fontSize: 15 }}>Workspace</h3>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Brand voice</label>
        <textarea rows={3} style={inputStyle} value={s.brandVoice} onChange={(e) => set("brandVoice", e.target.value)} placeholder="warm, concise, never pushy" />
      </div>
      <label style={{ fontWeight: 600, display: "block", marginBottom: 14 }}>
        <input type="checkbox" checked={s.researchEnabled} onChange={(e) => set("researchEnabled", e.target.checked)} /> Research agent enabled
      </label>
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Research rollout %</label>
          <input type="number" min={0} max={100} style={inputStyle} value={s.researchRolloutPct} onChange={(e) => set("researchRolloutPct", Number(e.target.value))} />
        </div>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Monthly research cap ($)</label>
          <input type="number" min={0} step="0.01" style={inputStyle} value={(s.researchMonthlyCapCents / 100).toFixed(2)} onChange={(e) => set("researchMonthlyCapCents", Math.round(Number(e.target.value) * 100))} />
        </div>
      </div>

      <h3 style={sectionH}>Twilio — your SMS gateway</h3>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Account SID</label>
        <input style={inputStyle} value={s.twilioAccountSid} onChange={(e) => set("twilioAccountSid", e.target.value)} placeholder="ACxxxxxxxx" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Auth token {status(secrets.TWILIO_AUTH_TOKEN)}</label>
        <input type="password" autoComplete="off" style={inputStyle} value={authToken} onChange={(e) => setAuthToken(e.target.value)} placeholder={secrets.TWILIO_AUTH_TOKEN ? "•••• (leave blank to keep)" : "Twilio auth token"} />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Messaging Service SID</label>
        <input style={inputStyle} value={s.twilioNumber} onChange={(e) => set("twilioNumber", e.target.value)} placeholder="MGxxxxxxxx (10DLC)" />
      </div>

      <h3 style={sectionH}>Email / SMTP — your gateway</h3>
      <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 2, minWidth: 180 }}>
          <label style={labelStyle}>SMTP host</label>
          <input style={inputStyle} value={s.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.yourprovider.com" />
        </div>
        <div style={{ flex: 1, minWidth: 90 }}>
          <label style={labelStyle}>Port</label>
          <input type="number" style={inputStyle} value={s.smtpPort || ""} onChange={(e) => set("smtpPort", Number(e.target.value) || 0)} placeholder="587" />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>SMTP username</label>
        <input style={inputStyle} value={s.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} placeholder="apikey or username" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>SMTP password {status(secrets.SMTP_PASS)}</label>
        <input type="password" autoComplete="off" style={inputStyle} value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder={secrets.SMTP_PASS ? "•••• (leave blank to keep)" : "SMTP password"} />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>From address</label>
        <input style={inputStyle} value={s.emailSender} onChange={(e) => set("emailSender", e.target.value)} placeholder="you@company.com" />
      </div>

      <button onClick={save} disabled={busy} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 }}>
        {busy ? "Saving…" : "Save settings"}
      </button>
      {msg && <span style={{ marginLeft: 12 }}>{msg}</span>}
    </div>
  );
}
