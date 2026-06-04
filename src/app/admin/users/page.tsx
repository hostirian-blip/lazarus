// Admin-only: manage platform users — list, promote/demote, create new admins.
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { UsersManager } from "./UsersManager";

export const dynamic = "force-dynamic";

export default async function AdminUsers() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const [users, tenants] = await Promise.all([
    db.user.findMany({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        tenant: { select: { id: true, name: true } },
      },
    }),
    db.tenant.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <AppShell
      nav={ADMIN_NAV}
      active="/admin/users"
      user={{ name: session.user.name, email: session.user.email, role: "admin" }}
      breadcrumb="Admin / Users"
      title="Users"
    >
      <p className="muted" style={{ maxWidth: 620, marginTop: 0 }}>
        Platform <strong>admins</strong> can manage credentials and every tenant. Promote an existing
        user, or create a brand-new admin. You can&apos;t change your own role or remove the last admin.
      </p>
      <UsersManager
        currentUserId={session.user.id}
        users={users.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          emailVerified: u.emailVerified,
          tenantName: u.tenant?.name ?? "—",
          createdAt: u.createdAt.toISOString(),
        }))}
        tenants={tenants}
      />
    </AppShell>
  );
}
