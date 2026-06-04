"use client";
import { useState, useEffect } from "react";
import { Brand } from "@/components/Brand";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#compliance", label: "Compliance" },
  { href: "#roi", label: "Research ROI" },
];

export function SiteNav() {
  const [open, setOpen] = useState(false);

  // Lock body scroll while the mobile menu is open; close on Escape.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a href="/" aria-label="Lazarus home" onClick={() => setOpen(false)}>
          <Brand />
        </a>

        {/* Desktop navigation */}
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((l) => (
            <a key={l.href} className="muted nav-link" href={l.href}>
              {l.label}
            </a>
          ))}
          <a className="btn btn-ghost" href="/login" style={{ padding: "9px 16px" }}>
            Log in
          </a>
          <a className="btn btn-gold" href="/signup" style={{ padding: "9px 16px" }}>
            Start resurrecting
          </a>
        </nav>

        {/* Hamburger (mobile only) */}
        <button
          type="button"
          className={`hamburger ${open ? "is-open" : ""}`}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* Slide-down mobile menu */}
      <nav
        id="mobile-menu"
        className={`mobile-menu ${open ? "is-open" : ""}`}
        aria-label="Mobile"
      >
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <div className="mobile-menu-cta">
          <a className="btn btn-ghost btn-block" href="/login" onClick={() => setOpen(false)}>
            Log in
          </a>
          <a className="btn btn-gold btn-block" href="/signup" onClick={() => setOpen(false)}>
            Start resurrecting
          </a>
        </div>
      </nav>

      {/* Tap-out overlay */}
      <div
        className={`mobile-overlay ${open ? "is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
    </header>
  );
}
