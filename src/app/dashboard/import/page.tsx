// Protected leads-import page (BUILD_PLAN step 2).
import { requireSession } from "@/lib/tenant";
import { ImportForm } from "./ImportForm";

export const dynamic = "force-dynamic";

export default async function ImportPage() {
  await requireSession();
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 32 }}>
      <h1 style={{ marginBottom: 4 }}>Import leads</h1>
      <p style={{ color: "#555" }}>
        Upload a CSV or XLSX of your old contacts. We map common columns
        (name, email, phone, company), normalize phone numbers to E.164, and skip
        duplicates — both within the file and against leads you already have.
        Imported leads start with <strong>no messaging consent</strong>; that gate
        must pass before any outreach.
      </p>
      <ImportForm />
      <p style={{ marginTop: 24 }}>
        <a href="/dashboard" style={{ color: "#2563eb" }}>← Back to dashboard</a>
      </p>
    </main>
  );
}
