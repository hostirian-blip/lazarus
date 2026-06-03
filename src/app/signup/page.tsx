"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
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
      // Auto sign-in after successful sign-up.
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
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
    <main style={wrap}>
      <h1>Create your Lazarus account</h1>
      <p style={{ color: "#555" }}>Start re-nurturing your dead leads.</p>
      <form onSubmit={onSubmit} style={col}>
        <label style={col}>
          Company name
          <input style={input} value={form.companyName} onChange={update("companyName")} required />
        </label>
        <label style={col}>
          Your name
          <input style={input} value={form.name} onChange={update("name")} />
        </label>
        <label style={col}>
          Work email
          <input style={input} type="email" value={form.email} onChange={update("email")} required />
        </label>
        <label style={col}>
          Password
          <input
            style={input}
            type="password"
            value={form.password}
            onChange={update("password")}
            minLength={8}
            required
          />
        </label>
        {error && <p style={{ color: "#c00", margin: 0 }}>{error}</p>}
        <button style={button} type="submit" disabled={loading}>
          {loading ? "Creating…" : "Create account"}
        </button>
      </form>
      <p style={{ marginTop: 16 }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
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
