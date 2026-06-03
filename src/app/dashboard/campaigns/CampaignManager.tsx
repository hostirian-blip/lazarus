"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Step {
  channel: "sms" | "email";
  delayHours: number;
  body: string;
}
export interface Campaign {
  id: string;
  name: string;
  active: boolean;
  steps: Step[];
}

const btn = { padding: "8px 14px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8, cursor: "pointer" } as const;
const cell = { padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6 } as const;

export function CampaignManager({ initial }: { initial: Campaign[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setBusy(true);
    await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    setName("");
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, margin: "24px 0" }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New campaign name" style={{ ...cell, flex: 1 }} />
        <button onClick={create} disabled={busy} style={btn}>Create</button>
      </div>
      {initial.length === 0 && <p style={{ color: "#666" }}>No campaigns yet — create one to start a re-nurture sequence.</p>}
      {initial.map((c) => (
        <CampaignCard key={c.id} campaign={c} />
      ))}
    </div>
  );
}

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(campaign.steps);
  const [active, setActive] = useState(campaign.active);
  const [busy, setBusy] = useState(false);
  const [enrollMsg, setEnrollMsg] = useState<string | null>(null);

  async function launch() {
    setEnrollMsg("Enrolling eligible leads…");
    const res = await fetch(`/api/campaigns/${campaign.id}/enroll`, { method: "POST" });
    const j = await res.json().catch(() => ({}));
    setEnrollMsg(res.ok ? `Enrolled ${j.enrolled} lead(s) — ${j.alreadyEnrolled} already in, ${j.candidates} eligible.` : j.error || "Enroll failed");
    router.refresh();
  }

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/campaigns/${campaign.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setBusy(false);
    router.refresh();
  }
  async function remove() {
    if (!confirm(`Delete campaign "${campaign.name}"?`)) return;
    await fetch(`/api/campaigns/${campaign.id}`, { method: "DELETE" });
    router.refresh();
  }
  const setStep = (i: number, p: Partial<Step>) => setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...p } : s)));

  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <strong style={{ fontSize: 18 }}>{campaign.name}</strong>
        <label style={{ marginLeft: "auto", fontSize: 14 }}>
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => {
              setActive(e.target.checked);
              patch({ active: e.target.checked });
            }}
          />{" "}
          Active
        </label>
        <button onClick={launch} disabled={!active} title={active ? "Enroll eligible leads" : "Activate the campaign first"} style={{ ...btn, background: active ? "#15803d" : "#9ca3af" }}>Launch</button>
        <button onClick={remove} style={{ ...btn, background: "#b91c1c" }}>Delete</button>
      </div>
      {enrollMsg && <p style={{ margin: "8px 0 0", fontSize: 13, color: "var(--ink-dim)" }}>{enrollMsg}</p>}

      <div style={{ marginTop: 12 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
            <select value={s.channel} onChange={(e) => setStep(i, { channel: e.target.value as "sms" | "email" })} style={cell}>
              <option value="sms">SMS</option>
              <option value="email">Email</option>
            </select>
            <input type="number" min={0} value={s.delayHours} onChange={(e) => setStep(i, { delayHours: Number(e.target.value) })} style={{ ...cell, width: 90 }} title="Delay (hours)" />
            <textarea value={s.body} onChange={(e) => setStep(i, { body: e.target.value })} placeholder="Message template" rows={2} style={{ ...cell, flex: 1 }} />
            <button onClick={() => setSteps(steps.filter((_, idx) => idx !== i))} style={{ ...btn, background: "#6b7280" }}>×</button>
          </div>
        ))}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button onClick={() => setSteps([...steps, { channel: "sms", delayHours: 24, body: "" }])} style={{ ...btn, background: "#374151" }}>+ Step</button>
          <button onClick={() => patch({ sequence: steps })} disabled={busy} style={btn}>Save sequence</button>
        </div>
      </div>
    </div>
  );
}
