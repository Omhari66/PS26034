import { LoginForm } from "../../components/LoginForm";

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {/* Branding */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>⚖️</div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.5px",
            marginBottom: 6,
          }}
        >
          PS 26034
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Legal Metrology Inspection Platform — Supervisor Dashboard
        </p>
      </div>

      {/* Card */}
      <div
        className="card"
        style={{
          width: "100%",
          maxWidth: 420,
          padding: "32px 28px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>
            Sign in
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            Use your supervisor or inspector account.
          </p>
        </div>
        <LoginForm />
      </div>

      <p style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
        Phase 6 — JWT authentication. Tokens expire after 8 hours.
      </p>
    </div>
  );
}
