"use client";
import { useState } from "react";

export function BillingButtons({ status }: { status: string | null }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function go(path: string) {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(path, { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.ok && j.url) window.location.href = j.url;
      else setErr(j.error ?? "Billing not available");
    } catch {
      setErr("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
        Subscription: <strong>{status || "none"}</strong>
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button className="btn btn-gold" disabled={busy} onClick={() => go("/api/billing/checkout")}>{busy ? "…" : "Subscribe"}</button>
        <button className="btn btn-ghost" style={{ color: "var(--ink)", borderColor: "var(--line-ink)" }} disabled={busy} onClick={() => go("/api/billing/portal")}>Manage billing</button>
      </div>
      {err && <p style={{ color: "var(--rust)", fontSize: 13 }}>{err}</p>}
    </div>
  );
}
