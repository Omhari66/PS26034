"use client";

import { useState } from "react";
import { BASE_URL } from "../lib/api";

interface LoginResult {
  token: string;
  role: "inspector" | "supervisor";
  email: string;
}

export function LoginForm() {
  const [email, setEmail] = useState("supervisor@demo.ps26034");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.detail?.message ?? "Invalid credentials.");
      }

      const data: LoginResult = await res.json();
      // Store token in sessionStorage (cleared on tab close — safe for demo)
      sessionStorage.setItem("ps26034_token", data.token);
      sessionStorage.setItem("ps26034_role", data.role);
      sessionStorage.setItem("ps26034_email", data.email);
      // Redirect to dashboard
      window.location.href = "/";
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        width: "100%",
        maxWidth: 380,
      }}
    >
      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}
        >
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{
            width: "100%",
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      <div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            color: "var(--text-secondary)",
            marginBottom: 6,
          }}
        >
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter password"
          style={{
            width: "100%",
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            fontSize: 14,
            outline: "none",
          }}
        />
      </div>

      {error && (
        <div
          style={{
            background: "var(--fail-bg)",
            border: "1px solid var(--fail)",
            borderRadius: "var(--radius)",
            padding: "10px 14px",
            color: "var(--fail)",
            fontSize: 13,
          }}
        >
          ✗ {error}
        </div>
      )}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading}
        style={{ width: "100%", justifyContent: "center", padding: "11px 0" }}
      >
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <div
        style={{
          background: "var(--surface-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          padding: "12px 14px",
          fontSize: 12,
          color: "var(--text-tertiary)",
        }}
      >
        <strong style={{ color: "var(--text-secondary)" }}>Demo accounts:</strong>
        <br />
        <code>supervisor@demo.ps26034</code> / <code>supervisor123</code>
        <br />
        <code>inspector@demo.ps26034</code> / <code>inspector123</code>
      </div>
    </form>
  );
}
