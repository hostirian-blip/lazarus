"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthHero } from "@/components/AuthHero";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }
      router.push(callbackUrl);
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
            New here? <a href="/signup" style={{ color: "var(--gold-2)", fontWeight: 600 }}>Create an account</a>
          </div>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: 0, letterSpacing: "-0.02em" }}>Welcome back</h2>
          <p className="muted" style={{ marginTop: 8 }}>Log in to your workspace.</p>
          <form onSubmit={onSubmit} style={{ marginTop: 24 }}>
            <label className="field">
              <span>Work email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required />
            </label>
            <label className="field">
              <span>Password</span>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <div style={{ textAlign: "right", margin: "-6px 0 14px" }}>
              <a href="/reset" className="muted" style={{ fontSize: 13 }}>Forgot password?</a>
            </div>
            {error && <p style={{ color: "var(--rust)", margin: "0 0 12px" }}>{error}</p>}
            <button className="btn btn-gold btn-block" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
