// Platform admin section — gated to users with role "admin".
// Deliberate exception to per-tenant scoping: only platform operators reach it.
// Regular tenant users are redirected back to their dashboard.
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { SignOutButton } from "../dashboard/SignOutButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [tenantCount, userCount, leadCount] = await Promise.all([
    db.tenant.count(),
    db.user.count(),
    db.lead.count(),
  ]);

  return (
    <main style={{ maxWidth: 880, margin: "0 auto", padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>Lazarus Admin</h1>
          <p style={{ margin: 0, color: "#666" }}>Signed in as {session.user.email}</p>
        </div>
        <SignOutButton />
      </header>

      <section style={{ display: "flex", gap: 16, marginTop: 24 }}>
        <Stat label="Tenants" value={tenantCount} />
        <Stat label="Users" value={userCount} />
        <Stat label="Leads" value={leadCount} />
      </section>

      <p style={{ color: "#999", fontSize: 14, marginTop: 24 }}>
        Platform-wide overview. TODO(claude-code): expand into tenant management,
        billing, and split-test rollups as Phase 1 progresses.
      </p>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: 16, border: "1px solid #eee", borderRadius: 10, minWidth: 120 }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
      <div style={{ color: "#666", fontSize: 14 }}>{label}</div>
    </div>
  );
}
