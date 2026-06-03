// Platform admin overview (same shell/look as the client app).
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";

export const dynamic = "force-dynamic";
const fmt = (n: number) => n.toLocaleString("en-US");

export default async function AdminHome() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [tenants, users, leads] = await Promise.all([db.tenant.count(), db.user.count(), db.lead.count()]);

  return (
    <AppShell
      nav={ADMIN_NAV}
      active="/admin"
      user={{ name: session.user.name, email: session.user.email, role: "admin" }}
      breadcrumb="Platform / Admin"
      title="Admin overview"
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        <div className="kpi"><div className="label">Tenants</div><div className="v">{fmt(tenants)}</div></div>
        <div className="kpi"><div className="label">Users</div><div className="v">{fmt(users)}</div></div>
        <div className="kpi"><div className="label">Leads · all tenants</div><div className="v">{fmt(leads)}</div></div>
      </div>

      <div className="card" style={{ padding: 20, maxWidth: 540 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 16 }}>Platform credentials</h3>
        <p className="muted" style={{ fontSize: 14, marginTop: 0 }}>
          Manage integration API keys (Anthropic, HubSpot, Twilio, email, Stripe). Stored encrypted at rest.
        </p>
        <a className="btn btn-gold" href="/admin/settings">Open credentials →</a>
      </div>
    </AppShell>
  );
}
