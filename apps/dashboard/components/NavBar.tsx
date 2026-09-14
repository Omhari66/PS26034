"use client";

import { useEffect, useState } from "react";
import { getEmail, getRole, logout } from "../lib/api";

const ROLE_STYLE: Record<string, { color: string; bg: string }> = {
  supervisor: { color: "var(--review)", bg: "var(--review-bg)" },
  inspector: { color: "var(--pass)", bg: "var(--pass-bg)" },
};

export function NavBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    setEmail(getEmail());
    setRole(getRole());
  }, []);

  const style = role ? (ROLE_STYLE[role] ?? ROLE_STYLE.inspector) : null;

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        gap: "24px",
        padding: "0 32px",
        height: "56px",
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Brand */}
      <span
        style={{
          fontWeight: 800,
          fontSize: 16,
          color: "var(--text-primary)",
          letterSpacing: "-0.3px",
        }}
      >
        ⚖️ PS 26034
      </span>
      <span
        style={{
          fontSize: 12,
          color: "var(--text-tertiary)",
          borderLeft: "1px solid var(--border)",
          paddingLeft: 16,
        }}
      >
        Supervisor Dashboard
      </span>

      {/* Nav links */}
      <div style={{ display: "flex", gap: 8 }}>
        <a href="/" className="btn btn-ghost" style={{ fontSize: 13 }}>
          All Inspections
        </a>
        <a
          href="/review"
          className="btn btn-ghost"
          style={{ fontSize: 13, color: "var(--review)" }}
        >
          REVIEW Queue
        </a>
      </div>

      {/* User / auth */}
      <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
        {email && role && style ? (
          <>
            <span
              style={{
                fontSize: 12,
                color: style.color,
                background: style.bg,
                padding: "3px 10px",
                borderRadius: 20,
                fontWeight: 600,
              }}
            >
              {role}
            </span>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              {email}
            </span>
            <button
              onClick={logout}
              className="btn btn-ghost"
              style={{ fontSize: 12, color: "var(--fail)" }}
            >
              Sign out
            </button>
          </>
        ) : (
          <a href="/login" className="btn btn-primary" style={{ fontSize: 12 }}>
            Sign in
          </a>
        )}
      </div>
    </nav>
  );
}
