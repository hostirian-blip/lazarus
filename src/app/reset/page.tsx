"use client";
import { useState } from "react";
import { AuthHero } from "@/components/AuthHero";

export default function ResetRequestPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    await fetch("/api/auth/reset/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    setSent(true);
    setBusy(false);
  }

  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="muted" style={{ textAlign: "right", marginBottom: 28, fontSize: 14 }}>
            Remembered it? <a href="/login" style={{ color: "var(--gold-2)", fontWeight: 600 }}>Log in</a>
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Reset password</h2>
          {sent ? (
            <p className="muted" style={{ marginTop: 16 }}>If an account exists for that email, a reset link is on its way. Check your inbox.</p>
          ) : (
            <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
              <label className="field">
                <span>Work email</span>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
              </label>
              <button className="btn btn-gold btn-block" type="submit" disabled={busy}>{busy ? "Sending…" : "Send reset link"}</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
