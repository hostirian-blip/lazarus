// Admin-only platform credentials page. Shows set/not-set status (never the
// secret values) and lets an admin set/replace them; values are encrypted at rest.
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSettingsStatus } from "@/lib/settings/platform";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettings() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const fields = await getSettingsStatus();

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <p style={{ marginBottom: 4 }}>
        <a href="/admin" style={{ color: "#2563eb" }}>← Admin</a>
      </p>
      <h1>Platform credentials</h1>
      <p style={{ color: "#555" }}>
        Integration API keys. Stored <strong>encrypted</strong> (AES-256-GCM) and never shown back —
        leave a field blank to keep its current value. A DB value overrides the server <code>.env</code>.
      </p>
      <SettingsForm fields={fields} />
    </main>
  );
}
