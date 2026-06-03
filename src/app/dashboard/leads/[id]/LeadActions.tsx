"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["new", "researching", "queued", "engaged", "replied", "booked", "dead"];
const field: React.CSSProperties = { padding: "6px 8px", border: "1px solid #d1d5db", borderRadius: 6 };

export function LeadActions({ id, revenueCents, status }: { id: string; revenueCents: number; status: string }) {
  const router = useRouter();
  const [rev, setRev] = useState((revenueCents / 100).toFixed(2));
  const [st, setSt] = useState(status);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revenueCents: Math.round(Number(rev) * 100) || 0, status: st }),
    });
    setMsg(res.ok ? "Saved" : "Failed");
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
      <div>
        <div className="label">Revenue ($)</div>
        <input type="number" step="0.01" min={0} value={rev} onChange={(e) => setRev(e.target.value)} style={{ ...field, width: 120 }} />
      </div>
      <div>
        <div className="label">Status</div>
        <select value={st} onChange={(e) => setSt(e.target.value)} style={field}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <button onClick={save} disabled={busy} className="btn btn-gold" style={{ padding: "8px 14px" }}>{busy ? "…" : "Save"}</button>
      {msg && <span className="muted" style={{ fontSize: 13 }}>{msg}</span>}
    </div>
  );
}
