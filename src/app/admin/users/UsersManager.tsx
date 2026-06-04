"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface UserRow {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  tenantName: string;
  createdAt: string;
}
interface Tenant { id: string; name: string }

export function UsersManager({
  currentUserId,
  users,
  tenants,
}: {
  currentUserId: string;
  users: UserRow[];
  tenants: Tenant[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function setRole(u: UserRow, role: string) {
    setBusyId(u.id);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`${u.email} is now ${role}.`);
        router.refresh();
      } else setErr(j.error ?? "Update failed");
    } catch {
      setErr("Network error");
    } finally {
      setBusyId(null);
    }
  }

  // Create-admin form state
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "admin",
    tenantId: tenants[0]?.id ?? "",
  });

  async function createUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreating(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setMsg(`Created ${j.user?.email} (${j.user?.role}).`);
        setForm({ email: "", name: "", password: "", role: "admin", tenantId: tenants[0]?.id ?? "" });
        router.refresh();
      } else {
        setErr(j.error ?? "Create failed");
      }
    } catch {
      setErr("Network error");
    } finally {
      setCreating(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 11px",
    border: "1px solid var(--line-ink, #d1d5db)",
    borderRadius: 8,
    background: "transparent",
    color: "inherit",
  };

  return (
    <div>
      {(msg || err) && (
        <p style={{ color: err ? "var(--rust, #b91c1c)" : "var(--alive, #15803d)", fontSize: 14 }}>
          {err ?? msg}
        </p>
      )}

      {/* Existing users */}
      <div className="card table-wrap" style={{ padding: 0, marginBottom: 18, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ textAlign: "left", fontSize: 12, color: "var(--muted, #9ca3af)" }}>
              <th style={{ padding: "12px 14px" }}>User</th>
              <th style={{ padding: "12px 14px" }}>Tenant</th>
              <th style={{ padding: "12px 14px" }}>Role</th>
              <th style={{ padding: "12px 14px", textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUserId;
              const isAdmin = u.role === "admin";
              return (
                <tr key={u.id} style={{ borderTop: "1px solid var(--line-ink, #e5e7eb)" }}>
                  <td style={{ padding: "12px 14px" }}>
                    <div style={{ fontWeight: 600 }}>{u.name || u.email}</div>
                    <div style={{ fontSize: 13, color: "var(--muted, #9ca3af)" }}>
                      {u.email} {u.emailVerified ? "" : "· unverified"}
                    </div>
                  </td>
                  <td style={{ padding: "12px 14px", fontSize: 14 }}>{u.tenantName}</td>
                  <td style={{ padding: "12px 14px" }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 999,
                        background: isAdmin ? "var(--gold, #ca8a04)" : "transparent",
                        color: isAdmin ? "#1a1a1a" : "inherit",
                        border: isAdmin ? "none" : "1px solid var(--line-ink, #d1d5db)",
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: "12px 14px", textAlign: "right" }}>
                    {isSelf ? (
                      <span style={{ fontSize: 13, color: "var(--muted, #9ca3af)" }}>you</span>
                    ) : (
                      <button
                        className="btn btn-ghost"
                        disabled={busyId === u.id}
                        onClick={() => setRole(u, isAdmin ? "user" : "admin")}
                        style={{ fontSize: 13 }}
                      >
                        {busyId === u.id ? "…" : isAdmin ? "Demote to user" : "Make admin"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create a new admin */}
      <div className="card" style={{ padding: 22, maxWidth: 560 }}>
        <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>Create a user</h3>
        <p className="muted" style={{ fontSize: 13, marginTop: 0 }}>
          Creates an account directly (email pre-verified). Share the password securely.
        </p>
        <form onSubmit={createUser} style={{ marginTop: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Email</label>
            <input
              type="email"
              required
              autoComplete="off"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Name (optional)</label>
            <input
              type="text"
              autoComplete="off"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>
              Temporary password (min 8 chars)
            </label>
            <input
              type="text"
              required
              minLength={8}
              autoComplete="off"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                style={inputStyle}
              >
                <option value="admin">admin</option>
                <option value="user">user</option>
              </select>
            </div>
            <div style={{ flex: "1 1 160px" }}>
              <label style={{ display: "block", fontWeight: 600, marginBottom: 4 }}>Tenant</label>
              <select
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                style={inputStyle}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="btn btn-gold" disabled={creating || !form.tenantId}>
            {creating ? "Creating…" : "Create user"}
          </button>
        </form>
      </div>
    </div>
  );
}
