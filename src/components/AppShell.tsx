// Shared in-app shell: dark sidebar + cream main, responsive (collapses to a
// sticky top bar on mobile). Layout via CSS classes so media queries can adapt.
import { Brand } from "./Brand";
import { SignOutButton } from "./SignOutButton";

export interface NavItem {
  href: string;
  label: string;
}

export const CLIENT_NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/import", label: "Import" },
  { href: "/dashboard/campaigns", label: "Campaigns" },
  { href: "/dashboard/settings", label: "Settings" },
];

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Credentials" },
  { href: "/dashboard", label: "Client app" },
];

function initials(s: string): string {
  return s.split(/[ @.]/).filter(Boolean).slice(0, 2).map((w) => (w[0] || "").toUpperCase()).join("");
}

export function AppShell({
  nav,
  active,
  user,
  title,
  breadcrumb,
  actions,
  children,
}: {
  nav: NavItem[];
  active: string;
  user: { name?: string | null; email?: string | null; role?: string };
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const display = user.name || user.email || "Member";
  return (
    <div className="app app-shell">
      <aside className="app-sidebar">
        <div style={{ padding: "2px 6px" }}>
          <a href="/dashboard"><Brand size={20} /></a>
        </div>
        <nav className="app-nav">
          {nav.map((n) => (
            <a key={n.href} href={n.href} className={"navlink" + (n.href === active ? " active" : "")}>{n.label}</a>
          ))}
        </nav>
        <div className="app-userbox">
          <div className="who" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--surface-2)", display: "grid", placeItems: "center", fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>{initials(display)}</div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{display}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", textTransform: "capitalize" }}>{user.role || "Member"}</div>
            </div>
          </div>
          <SignOutButton />
        </div>
      </aside>

      <main className="app-main">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 22, flexWrap: "wrap" }}>
          <div>
            {breadcrumb && <div className="label" style={{ marginBottom: 6 }}>{breadcrumb}</div>}
            <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em" }}>{title}</h1>
          </div>
          {actions && <div style={{ marginLeft: "auto", display: "flex", gap: 10, flexWrap: "wrap" }}>{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}
