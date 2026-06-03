"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface TenantSettings {
  brandVoice: string;
  emailSender: string;
  twilioNumber: string;
  researchEnabled: boolean;
  researchRolloutPct: number;
  researchMonthlyCapCents: number;
}

const labelStyle = { display: "block", fontWeight: 600, marginBottom: 4 } as const;
const inputStyle = { width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 } as const;

export function SettingsForm({ initial }: { initial: TenantSettings }) {
  const router = useRouter();
  const [s, setS] = useState<TenantSettings>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tenant/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(s),
      });
      setMsg(res.ok ? "Saved." : "Save failed");
      if (res.ok) router.refresh();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Brand voice</label>
        <textarea
          rows={3}
          style={inputStyle}
          value={s.brandVoice}
          onChange={(e) => setS({ ...s, brandVoice: e.target.value })}
          placeholder="e.g. warm, concise, never pushy; speak like a helpful peer"
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Email sender (from-address)</label>
        <input style={inputStyle} value={s.emailSender} onChange={(e) => setS({ ...s, emailSender: e.target.value })} placeholder="you@yourcompany.com" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Twilio Messaging Service SID</label>
        <input style={inputStyle} value={s.twilioNumber} onChange={(e) => setS({ ...s, twilioNumber: e.target.value })} placeholder="MGxxxxxxxx (per-tenant, 10DLC)" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontWeight: 600 }}>
          <input type="checkbox" checked={s.researchEnabled} onChange={(e) => setS({ ...s, researchEnabled: e.target.checked })} /> Research agent enabled
        </label>
      </div>
      <div style={{ display: "flex", gap: 16, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <label style={labelStyle}>Research rollout %</label>
          <input type="number" min={0} max={100} style={inputStyle} value={s.researchRolloutPct} onChange={(e) => setS({ ...s, researchRolloutPct: Number(e.target.value) })} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>Monthly research cap ($)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            style={inputStyle}
            value={(s.researchMonthlyCapCents / 100).toFixed(2)}
            onChange={(e) => setS({ ...s, researchMonthlyCapCents: Math.round(Number(e.target.value) * 100) })}
          />
        </div>
      </div>
      <button onClick={save} disabled={busy} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 }}>
        {busy ? "Saving…" : "Save settings"}
      </button>
      {msg && <span style={{ marginLeft: 12 }}>{msg}</span>}
    </div>
  );
}
