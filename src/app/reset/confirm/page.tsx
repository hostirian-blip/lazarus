"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthHero } from "@/components/AuthHero";

function ConfirmForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/reset/confirm", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setError(j.error ?? "Reset failed");
    else setDone(true);
    setBusy(false);
  }

  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Set a new password</h2>
          {!token ? (
            <p style={{ color: "var(--rust)", marginTop: 16 }}>Missing reset token — <a href="/reset" style={{ color: "var(--gold-2)" }}>request a new link</a>.</p>
          ) : done ? (
            <p className="muted" style={{ marginTop: 16 }}>Password updated. <a href="/login" style={{ color: "var(--gold-2)", fontWeight: 600 }}>Log in →</a></p>
          ) : (
            <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
              <label className="field">
                <span>New password</span>
                <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
              </label>
              {error && <p style={{ color: "var(--rust)", margin: "0 0 12px" }}>{error}</p>}
              <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? "Saving…" : "Update password"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetConfirmPage() {
  return (
    <Suspense>
      <ConfirmForm />
    </Suspense>
  );
}
