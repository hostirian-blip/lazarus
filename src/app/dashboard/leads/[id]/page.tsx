// Lead detail — profile, consent state, research brief, outreach timeline.
import { notFound } from "next/navigation";
import { requireSession, tenantDb } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";

export const dynamic = "force-dynamic";

function Field({ k, v, mono }: { k: string; v?: string | null; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 14 }}>
      <span className="muted">{k}</span>
      <span style={mono ? { fontFamily: "var(--font-mono)" } : undefined}>{v || "—"}</span>
    </div>
  );
}

export default async function LeadDetail({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const scoped = tenantDb(session.user.tenantId);
  const lead = await scoped.lead.findFirst({ where: { id: params.id } });
  if (!lead) notFound();

  const events = await db.outreachEvent.findMany({ where: { leadId: lead.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const brief = lead.researchBrief && typeof lead.researchBrief === "object" ? (lead.researchBrief as Record<string, unknown>) : null;
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || lead.company || "Lead";

  return (
    <AppShell nav={CLIENT_NAV} active="/dashboard/leads" user={{ email: session.user.email, role: "Workspace" }} breadcrumb="Workspace / Leads" title={name}>
      <p style={{ marginTop: -8, marginBottom: 16 }}><a href="/dashboard/leads" style={{ color: "#2563eb" }}>← All leads</a></p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 style={{ marginTop: 0, fontSize: 16 }}>Profile</h3>
          <Field k="Company" v={lead.company} />
          <Field k="Email" v={lead.email} />
          <Field k="Phone" v={lead.phoneE164} mono />
          <Field k="Status" v={lead.status} />
          <Field k="Cohort" v={lead.researchCohort ?? "—"} />
          <Field k="CRM id" v={lead.crmId ?? "—"} />
          <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lead.optedOut && <span className="badge badge-rust">Opted out</span>}
            {lead.smsConsent && <span className="badge badge-green">SMS consent</span>}
            {lead.emailConsent && <span className="badge badge-green">Email consent</span>}
            {!lead.optedOut && !lead.smsConsent && !lead.emailConsent && <span className="label">No consent</span>}
          </div>
          {lead.consentSource && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Consent source: {lead.consentSource}</p>}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {brief && (
            <div className="card" style={{ padding: 18 }}>
              <h3 style={{ marginTop: 0, fontSize: 16 }}>Research brief</h3>
              {(["summary", "whatsChanged", "hook"] as const).map((k) =>
                brief[k] ? (
                  <p key={k} style={{ margin: "6px 0", fontSize: 14 }}>
                    <span className="label">{k}</span>
                    <br />
                    {String(brief[k])}
                  </p>
                ) : null,
              )}
              <p className="muted" style={{ fontSize: 12 }}>
                Confidence {typeof brief.confidence === "number" ? `${Math.round((brief.confidence as number) * 100)}%` : "—"} · cost{" "}
                {typeof brief.costCents === "number" ? `$${((brief.costCents as number) / 100).toFixed(2)}` : "—"}
              </p>
            </div>
          )}

          <div className="card" style={{ padding: 18 }}>
            <h3 style={{ marginTop: 0, fontSize: 16 }}>Timeline</h3>
            {events.length === 0 ? (
              <p className="muted" style={{ fontSize: 14 }}>No outreach yet.</p>
            ) : (
              events.map((e) => (
                <div key={e.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderTop: "1px solid var(--line-ink)" }}>
                  <span className={"badge " + (e.direction === "inbound" ? "badge-green" : "badge-gold")}>{e.direction} {e.channel}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, whiteSpace: "pre-wrap" }}>{e.body}</div>
                    <div className="muted" style={{ fontSize: 11 }}>{e.createdAt.toISOString().slice(0, 16).replace("T", " ")}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
