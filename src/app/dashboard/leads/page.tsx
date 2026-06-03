// Leads list — searchable, filterable, paginated, tenant-scoped.
import { requireSession, tenantDb } from "@/lib/tenant";
import { AppShell, CLIENT_NAV } from "@/components/AppShell";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
const PAGE = 25;

const th = { padding: "10px 12px", borderBottom: "1px solid var(--line-ink)" } as const;
const td = { padding: "10px 12px", borderBottom: "1px solid var(--line-ink)", fontSize: 14 } as const;

function statusBadge(status: string, optedOut: boolean): { cls: string; label: string } {
  if (optedOut) return { cls: "badge badge-rust", label: "Opted out" };
  switch (status) {
    case "booked": return { cls: "badge badge-green", label: "Booked" };
    case "replied": return { cls: "badge badge-green", label: "Replied" };
    case "engaged": return { cls: "badge badge-gold", label: "Engaged" };
    case "researching": return { cls: "badge badge-gold", label: "Researching" };
    case "dead": return { cls: "badge badge-rust", label: "Dead" };
    default: return { cls: "label", label: status || "New" };
  }
}

export default async function LeadsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await requireSession();
  const scoped = tenantDb(session.user.tenantId);
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status ?? "";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Prisma.LeadWhereInput = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { firstName: { contains: q, mode: "insensitive" } },
      { lastName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { phoneE164: { contains: q } },
    ];
  }

  const [total, leads] = await Promise.all([
    scoped.lead.count({ where }),
    scoped.lead.findMany({ where, orderBy: { createdAt: "desc" }, take: PAGE, skip: (page - 1) * PAGE }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (status) u.set("status", status);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `?${s}` : "?";
  };

  return (
    <AppShell nav={CLIENT_NAV} active="/dashboard/leads" user={{ email: session.user.email, role: "Workspace" }} breadcrumb="Workspace / Leads" title={`Leads (${total.toLocaleString("en-US")})`}>
      <form method="get" style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <input name="q" defaultValue={q} placeholder="Search name, email, phone, company" style={{ flex: 1, minWidth: 240, padding: "8px 10px", border: "1px solid var(--line-ink)", borderRadius: 8, background: "#fff" }} />
        <select name="status" defaultValue={status} style={{ padding: "8px 10px", border: "1px solid var(--line-ink)", borderRadius: 8, background: "#fff" }}>
          <option value="">All statuses</option>
          {["new", "researching", "engaged", "replied", "booked", "dead"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="btn btn-gold" type="submit">Search</button>
      </form>

      <div className="card table-wrap" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 560 }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--ink-dim)", fontSize: 12 }}>
              <th style={th}>Lead</th><th style={th}>Email</th><th style={th}>Phone</th><th style={th}>Consent</th><th style={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr><td style={td} colSpan={5}><span className="muted">No leads match.</span></td></tr>
            ) : (
              leads.map((l) => {
                const b = statusBadge(l.status, l.optedOut);
                const name = [l.firstName, l.lastName].filter(Boolean).join(" ") || l.company || "—";
                return (
                  <tr key={l.id}>
                    <td style={td}>
                      <a href={`/dashboard/leads/${l.id}`} style={{ color: "#2563eb", fontWeight: 600 }}>{name}</a>
                      <div style={{ fontSize: 12, color: "var(--ink-dim)" }}>{l.company}</div>
                    </td>
                    <td style={td}>{l.email || "—"}</td>
                    <td style={{ ...td, fontFamily: "var(--font-mono)", fontSize: 13 }}>{l.phoneE164 || "—"}</td>
                    <td style={td}>
                      {l.optedOut ? <span className="badge badge-rust">Opted out</span> : (
                        <>
                          {l.smsConsent && <span className="badge badge-green" style={{ marginRight: 6 }}>SMS</span>}
                          {l.emailConsent && <span className="badge badge-green">Email</span>}
                          {!l.smsConsent && !l.emailConsent && <span className="label">none</span>}
                        </>
                      )}
                    </td>
                    <td style={td}><span className={b.cls}>{b.label}</span></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
        <span className="muted" style={{ fontSize: 13 }}>Page {page} of {pages}</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          {page > 1 && <a className="btn btn-ghost" href={qs(page - 1)} style={{ padding: "6px 12px", color: "var(--ink)", borderColor: "var(--line-ink)" }}>← Prev</a>}
          {page < pages && <a className="btn btn-ghost" href={qs(page + 1)} style={{ padding: "6px 12px", color: "var(--ink)", borderColor: "var(--line-ink)" }}>Next →</a>}
        </div>
      </div>
    </AppShell>
  );
}
