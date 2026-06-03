"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthHero } from "@/components/AuthHero";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Sign-up failed.");
        return;
      }
      const result = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
      if (result?.error) {
        setError("Account created, but sign-in failed. Try logging in.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth">
      <AuthHero />
      <div className="auth-panel">
        <div className="auth-panel-inner">
          <div className="muted" style={{ textAlign: "right", marginBottom: 28, fontSize: 14 }}>
            Already have an account? <a href="/login" style={{ color: "var(--gold-2)", fontWeight: 600 }}>Log in</a>
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Start resurrecting leads</h2>
          <p className="muted" style={{ marginTop: 8 }}>Create your workspace in a minute. Import your first dead leads right after.</p>
          <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
            <label className="field">
              <span>Company name</span>
              <input className="input" value={form.companyName} onChange={update("companyName")} placeholder="Northwind Roofing" required />
            </label>
            <label className="field">
              <span>Your name</span>
              <input className="input" value={form.name} onChange={update("name")} placeholder="Optional" />
            </label>
            <label className="field">
              <span>Work email</span>
              <input className="input" type="email" value={form.email} onChange={update("email")} placeholder="you@company.com" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="input" type="password" value={form.password} onChange={update("password")} minLength={8} required />
            </label>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "var(--green-soft)", border: "1px solid rgba(70,201,138,.25)", borderRadius: 10, padding: "10px 12px", margin: "4px 0 16px" }}>
              <span style={{ color: "var(--green)" }}>✓</span>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                Lazarus only contacts leads with a verifiable consent source. You&apos;ll confirm yours during setup.
              </span>
            </div>
            {error && <p style={{ color: "var(--rust)", margin: "0 0 12px" }}>{error}</p>}
            <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create workspace"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
