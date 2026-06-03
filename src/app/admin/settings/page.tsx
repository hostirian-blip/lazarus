// Admin-only platform credentials (encrypted at rest; status-only display).
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettingsStatus } from "@/lib/settings/platform";
import { AppShell, ADMIN_NAV } from "@/components/AppShell";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const fields = await getSettingsStatus();

  return (
    <AppShell
      nav={ADMIN_NAV}
      active="/admin/settings"
      user={{ name: session.user.name, email: session.user.email, role: "admin" }}
      breadcrumb="Admin / Credentials"
      title="Platform credentials"
    >
      <p className="muted" style={{ maxWidth: 580, marginTop: 0 }}>
        Integration API keys, stored <strong>encrypted</strong> (AES-256-GCM) and never shown back —
        leave a field blank to keep its current value. A saved value overrides the server <code>.env</code>.
      </p>
      <div className="card" style={{ padding: 22, maxWidth: 620 }}>
        <SettingsForm fields={fields} />
      </div>
    </AppShell>
  );
}
