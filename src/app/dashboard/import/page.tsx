// Protected leads-import page (BUILD_PLAN step 2).
import { requireSession } from "@/lib/tenant";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";
import { ImportForm } from "./ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const session = await requireSession();
  return (
    <AppShell
      nav={CLIENT_NAV}
      active="/dashboard/import"
      user={{ email: session.user.email, role: "Workspace" }}
      breadcrumb="Workspace / Import"
      title="Import leads"
    >
      <p className="muted" style={{ maxWidth: 640, marginTop: 0 }}>
        Upload a CSV or XLSX of your old contacts. We map common columns (name, email, phone,
        company), normalize phone numbers to E.164, and skip duplicates. Imported leads start with{" "}
        <strong>no messaging consent</strong>; that gate must pass before any outreach.
      </p>
      <div className="card" style={{ padding: 22, maxWidth: 640 }}>
        <ImportForm />
      </div>
    </AppShell>
  );
}
