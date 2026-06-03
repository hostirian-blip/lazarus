// Multi-step leads-import wizard (BUILD_PLAN step 3).
import { requireSession } from "@/lib/tenant";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";
import { ImportWizard } from "./ImportWizard";

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
      <div className="card" style={{ padding: 22, maxWidth: 680 }}>
        <ImportWizard />
      </div>
    </AppShell>
  );
}
