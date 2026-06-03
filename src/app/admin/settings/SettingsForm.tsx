"use client";
import { useState } from "react";

export interface FieldStatus {
  key: string;
  label: string;
  secret: boolean;
  help?: string;
  set: boolean;
  source: "db" | "env" | "none";
}

export function SettingsForm({ fields }: { fields: FieldStatus[] }) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    for (const [k, v] of fd.entries()) if (typeof v === "string" && v.trim()) values[k] = v;
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const json = await res.json().catch(() => ({}));
      setMsg(res.ok ? `Saved ${json.updated?.length ?? 0} setting(s).` : json.error ?? "Save failed");
      if (res.ok) e.currentTarget.reset();
    } catch {
      setMsg("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ marginTop: 16, maxWidth: 560 }}>
      {fields.map((f) => (
        <div key={f.key} style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
            {f.label}{" "}
            <span style={{ fontWeight: 400, fontSize: 13, color: f.set ? "#15803d" : "#9ca3af" }}>
              {f.set ? `• set (${f.source})` : "• not set"}
            </span>
          </label>
          <input
            type={f.secret ? "password" : "text"}
            name={f.key}
            autoComplete="off"
            placeholder={f.set ? "•••••••• (leave blank to keep)" : f.help ?? `Set ${f.label}`}
            style={{ width: "100%", padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: 6 }}
          />
          {f.help && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{f.help}</div>}
        </div>
      ))}
      <button type="submit" disabled={busy} style={{ padding: "10px 16px", background: "#2563eb", color: "#fff", border: 0, borderRadius: 8 }}>
        {busy ? "Saving…" : "Save changes"}
      </button>
      {msg && <p style={{ marginTop: 12 }}>{msg}</p>}
    </form>
  );
}
