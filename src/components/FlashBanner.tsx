"use client";
import { useEffect, useState } from "react";

// Reads the ?hubspot= result from the OAuth redirect, shows a dismissible
// banner, and strips the param from the URL so it doesn't persist on refresh.
const MESSAGES: Record<string, { text: string; tone: "ok" | "warn" | "err" }> = {
  connected: { text: "HubSpot connected. You can sync contacts from Settings.", tone: "ok" },
  denied: { text: "HubSpot connection was cancelled.", tone: "warn" },
  unconfigured: { text: "HubSpot isn't enabled yet — the platform admin needs to add HubSpot API credentials.", tone: "warn" },
  error: { text: "Something went wrong connecting HubSpot. Please try again.", tone: "err" },
};

export function FlashBanner() {
  const [info, setInfo] = useState<{ text: string; tone: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const key = params.get("hubspot");
    if (key && MESSAGES[key]) {
      setInfo(MESSAGES[key]);
      params.delete("hubspot");
      const qs = params.toString();
      window.history.replaceState({}, "", window.location.pathname + (qs ? `?${qs}` : ""));
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
