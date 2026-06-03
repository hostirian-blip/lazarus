"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

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
    <main style={wrap}>
      <h1>Log in to Lazarus</h1>
      <form onSubmit={onSubmit} style={col}>
        <label style={col}>
          Email
          <input style={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label style={col}>
          Password
          <input
            style={input}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && <p style={{ color: "#c00", margin: 0 }}>{error}</p>}
        <button style={button} type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Need an account? <a href="/signup">Sign up</a>
      </p>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

const wrap: React.CSSProperties = { maxWidth: 420, margin: "64px auto", padding: 24 };
const col: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const input: React.CSSProperties = { padding: 10, fontSize: 15, border: "1px solid #ccc", borderRadius: 6 };
const button: React.CSSProperties = {
  marginTop: 8,
  padding: "10px 14px",
  fontSize: 15,
  background: "#111",
  color: "#fff",
  border: 0,
  borderRadius: 6,
  cursor: "pointer",
};
