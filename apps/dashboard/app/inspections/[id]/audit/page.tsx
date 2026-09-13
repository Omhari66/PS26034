"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchAuditTrail,
  AuditTrail,
  AuthError,
  getToken,
  logout,
} from "../../../../lib/api";
import { DecisionBadge } from "../../../../components/DecisionBadge";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AuditTrailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [trail, setTrail] = useState<AuditTrail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchAuditTrail(id)
      .then(setTrail)
      .catch((e) => {
        if (e instanceof AuthError) {
          logout();
        } else {
          setError((e as Error).message);
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        Loading…
      </div>
    );
  }

  if (error || !trail) {
    return (
      <div className="card" style={{ borderColor: "var(--fail)", color: "var(--fail)" }}>
        <strong>Error:</strong> {error ?? "Not found."}
        <br />
        <Link href="/" style={{ color: "var(--primary)", display: "inline-block", marginTop: 8 }}>
          ← Back to list
        </Link>
      </div>
    );
  }

  const { inspection, reviews } = trail;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
        <Link href="/">All Inspections</Link>
        {" / "}
        <Link href={`/inspections/${id}`} style={{ color: "var(--primary)" }}>
          {id.slice(0, 8)}…
        </Link>
        {" / Audit Trail"}
      </div>

      {/* Original Report */}
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "var(--surface-2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--text-secondary)",
              flexShrink: 0,
            }}
          >
            1
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Original Report</div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
              Inspector submitted — append-only, never modified
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <DecisionBadge decision={inspection.overall_decision} />
            <span className="badge badge-cat">{inspection.category}</span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: 10,
          }}
        >
          {inspection.field_results.map((fr) => (
            <div
              key={fr.field_name}
              style={{
                background: "var(--surface-2)",
                borderRadius: "var(--radius)",
                padding: "10px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span style={{ fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {fr.field_name}
              </span>
              <DecisionBadge decision={fr.decision} />
              {fr.evidence.value && (
                <span style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                  {fr.evidence.value}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Connecting line if there are reviews */}
      {reviews.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, flexShrink: 0, display: "flex", justifyContent: "center" }}>
            <div style={{ width: 2, height: 24, background: "var(--border)" }} />
          </div>
          <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
            {reviews.length} review{reviews.length > 1 ? "s" : ""} appended
          </span>
        </div>
      )}

      {/* Review records */}
      {reviews.map((rev, i) => (
        <div key={rev.id} className="card" style={{ borderColor: "var(--review)" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "var(--review-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 700,
                color: "var(--review)",
                flexShrink: 0,
              }}
            >
              {i + 2}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Supervisor Override
              </div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                by <strong style={{ color: "var(--text-secondary)" }}>{rev.reviewer_id}</strong>
                {" · "}
                {fmtDate(rev.created_at)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                <DecisionBadge decision={rev.original_decision} />
                {" → "}
              </span>
              <DecisionBadge decision={rev.overridden_decision} />
            </div>
          </div>

          <div
            style={{
              background: "var(--surface-2)",
              borderRadius: "var(--radius)",
              padding: "12px 16px",
              fontSize: 13,
              color: "var(--text-secondary)",
              fontStyle: "italic",
            }}
          >
            &ldquo;{rev.reason}&rdquo;
          </div>

          <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-tertiary)", fontFamily: "var(--font-mono)" }}>
            review id: {rev.id}
          </div>
        </div>
      ))}

      {reviews.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            color: "var(--text-tertiary)",
            fontSize: 13,
          }}
        >
          No reviews yet.{" "}
          <Link href={`/inspections/${id}`} style={{ color: "var(--primary)" }}>
            Override from the detail page →
          </Link>
        </div>
      )}
    </div>
  );
}
