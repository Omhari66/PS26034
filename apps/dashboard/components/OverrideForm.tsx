"use client";

import { useState } from "react";
import type { Decision } from "../lib/api";
import { submitReview } from "../lib/api";

const DECISIONS: Decision[] = ["PASS", "FAIL", "REVIEW", "NOT_APPLICABLE"];

export function OverrideForm({ inspectionId }: { inspectionId: string }) {
  const [decision, setDecision] = useState<Decision>("PASS");
  const [reason, setReason] = useState("");
  const [reviewerId, setReviewerId] = useState("supervisor-demo");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 10) {
      setError("Reason must be at least 10 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rec = await submitReview(inspectionId, {
        overridden_decision: decision,
        reason: reason.trim(),
        reviewer_id: reviewerId,
      });
      setDone(rec.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        style={{
          background: "var(--pass-bg)",
          border: "1px solid var(--pass)",
          borderRadius: "var(--radius)",
          padding: "16px 20px",
          color: "var(--pass)",
        }}
      >
        ✓ Review recorded (ID: <code style={{ fontSize: 11 }}>{done}</code>).
        The original report is unchanged.{" "}
        <a href={`/inspections/${inspectionId}/audit`} style={{ color: "var(--primary)", textDecoration: "underline" }}>
          View audit trail →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Override Decision
          </label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value as Decision)}
            style={{
              width: "100%",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
              fontSize: 14,
            }}
          >
            {DECISIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1, minWidth: 200 }}>
          <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
            Reviewer ID
          </label>
          <input
            value={reviewerId}
            onChange={(e) => setReviewerId(e.target.value)}
            style={{
              width: "100%",
              background: "var(--surface-2)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "8px 12px",
              fontSize: 14,
            }}
            placeholder="Your reviewer ID"
          />
        </div>
      </div>

      <div>
        <label style={{ fontSize: 12, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
          Reason (required, ≥10 characters)
        </label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          placeholder="Explain the basis for this override…"
          style={{
            width: "100%",
            background: "var(--surface-2)",
            color: "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius)",
            padding: "10px 12px",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
      </div>

      {error && (
        <div style={{ color: "var(--fail)", fontSize: 13 }}>✗ {error}</div>
      )}

      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading || reason.trim().length < 10}
        >
          {loading ? "Submitting…" : "Submit Override"}
        </button>
        <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
          The original report will not be modified.
        </span>
      </div>
    </form>
  );
}
