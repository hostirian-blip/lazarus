"use client";
import { useEffect, useState } from "react";

// Reads a CRM OAuth result (?hubspot=… / ?gohighlevel=…) from the redirect,
// shows a dismissible banner, and strips the param so it doesn't persist.
const PROVIDERS: Record<string, string> = {
  hubspot: "HubSpot",
  gohighlevel: "GoHighLevel",
};

function message(label: string, result: string): { text: string; tone: "ok" | "warn" | "err" } | null {
  switch (result) {
    case "connected":
      return { text: `${label} connected. You can sync contacts from Settings.`, tone: "ok" };
    case "denied":
      return { text: `${label} connection was cancelled.`, tone: "warn" };
    case "unconfigured":
      return { text: `${label} isn't enabled yet — the platform admin needs to add ${label} API credentials.`, tone: "warn" };
    case "error":
      return { text: `Something went wrong connecting ${label}. Please try again.`, tone: "err" };
    default:
      return null;
  }
}

export function FlashBanner() {
  const [info, setInfo] = useState<{ text: string; tone: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [param, label] of Object.entries(PROVIDERS)) {
      const result = params.get(param);
      if (!result) continue;
      const msg = message(label, result);
      if (msg) {
        setInfo(msg);
        params.delete(param);
        const qs = params.toString();
        window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
        break;
      }
    }
  }, []);

  if (!info) return null;

  const bg =
    info.tone === "ok" ? "var(--green-soft, #dcfce7)" : info.tone === "err" ? "var(--rust-soft, #fee2e2)" : "var(--gold-soft, #fef3c7)";
  const fg =
    info.tone === "ok" ? "var(--green, #15803d)" : info.tone === "err" ? "var(--rust, #b91c1c)" : "var(--gold, #b45309)";

  return (
    <div
      role="status"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        background: bg,
        color: fg,
        border: `1px solid ${fg}`,
        borderRadius: 10,
        padding: "12px 14px",
        marginBottom: 18,
        fontSize: 14,
        fontWeight: 600,
      }}
    >
      <span style={{ flex: 1 }}>{info.text}</span>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => setInfo(null)}
        style={{ background: "transparent", border: 0, color: fg, cursor: "pointer", fontSize: 18, lineHeight: 1 }}
      >
        ✕
      </button>
    </div>
  );
}
