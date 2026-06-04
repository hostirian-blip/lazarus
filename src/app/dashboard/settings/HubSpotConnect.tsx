"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function HubSpotConnect({
  connected,
  lastSyncedAt,
}: {
  connected: boolean;
  lastSyncedAt: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"sync" | "disconnect" | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function sync() {
    setBusy("sync");
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/connectors/hubspot/sync", { method: "POST" });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`Synced: ${j.created} new lead(s), ${j.duplicates} already on file (${j.pulled} pulled).`);
        router.refresh();
      } else {
        setErr(j.error ?? "Sync failed");
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(null);
    }
  }

  async function disconnect() {
    setBusy("disconnect");
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/connectors/hubspot/disconnect", { method: "POST" });
      if (res.ok) {
        setMsg("Disconnected. Imported leads were kept.");
        router.refresh();
      } else {
        setErr("Could not disconnect");
      }
    } catch {
      setErr("Network error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16, display: "flex", alignItems: "center", gap: 10 }}>
        CRM connection
        <span className={"badge " + (connected ? "badge-green" : "badge-gold")}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </h3>

      {connected ? (
        <>
          <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
            HubSpot is connected. Pull contacts in as leads — consent is mapped on import and re-checked
            before any message is sent.
            {lastSyncedAt && (
              <>
                {" "}
                Last synced{" "}
                <strong>{new Date(lastSyncedAt).toLocaleString()}</strong>.
              </>
            )}
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-gold" disabled={busy !== null} onClick={sync}>
              {busy === "sync" ? "Syncing…" : "Sync contacts now"}
            </button>
            <button
              className="btn btn-ghost"
              style={{ color: "var(--ink)", borderColor: "var(--line-ink)" }}
              disabled={busy !== null}
              onClick={disconnect}
            >
              {busy === "disconnect" ? "…" : "Disconnect"}
            </button>
          </div>
        </>
      ) : (
        <>
          <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
            Connect HubSpot to import leads and write activity back to your contacts.
          </p>
          <a className="btn btn-gold" href="/api/connectors/hubspot/start">Connect HubSpot</a>
        </>
      )}

      {msg && <p style={{ color: "var(--alive, #15803d)", fontSize: 13, marginBottom: 0 }}>{msg}</p>}
      {err && <p style={{ color: "var(--rust, #b91c1c)", fontSize: 13, marginBottom: 0 }}>{err}</p>}
    </div>
  );
}
