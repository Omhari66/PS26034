"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  fetchReport,
  InspectionReport,
  AuthError,
  getToken,
  logout,
} from "../../../lib/api";
import { DecisionBadge } from "../../../components/DecisionBadge";
import { OverrideForm } from "../../../components/OverrideForm";

// Evidence-state → human label
const STATE_LABEL: Record<string, string> = {
  FOUND: "Found",
  NOT_FOUND: "Not found",
  NOT_VERIFIABLE: "Unverifiable",
  CONFLICTING: "Conflict",
};

const FIELD_LABELS: Record<string, string> = {
  mrp: "MRP",
  net_quantity: "Net Quantity",
  manufacturing_date: "Mfg. Date",
  manufacturer_name: "Manufacturer",
  consumer_care: "Consumer Care",
};

export default function InspectionDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [report, setReport] = useState<InspectionReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchReport(id)
      .then(setReport)
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

  if (error || !report) {
    return (
      <div className="card" style={{ borderColor: "var(--fail)", color: "var(--fail)" }}>
        <strong>Not found:</strong> {error ?? "No submitted report for this ID."}
        <br />
        <Link href="/" style={{ color: "var(--primary)", marginTop: 8, display: "inline-block" }}>
          ← Back to list
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Breadcrumb ── */}
      <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>
        <Link href="/">All Inspections</Link>
        {" / "}
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{id}</span>
      </div>

      {/* ── Header card ── */}
      <div className="card" style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <h1 style={{ fontSize: 20, fontWeight: 800 }}>Inspection Report</h1>
            <DecisionBadge decision={report.overall_decision} />
          </div>
          <dl style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "4px 16px", fontSize: 13 }}>
            <dt style={{ color: "var(--text-tertiary)" }}>ID</dt>
            <dd style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>{report.inspection_id}</dd>
            <dt style={{ color: "var(--text-tertiary)" }}>Category</dt>
            <dd><span className="badge badge-cat">{report.category}</span></dd>
            <dt style={{ color: "var(--text-tertiary)" }}>Rule version</dt>
            <dd style={{ color: "var(--text-secondary)" }}>{report.rule_version}</dd>
          </dl>
        </div>

        {/* Coverage */}
        <div style={{ display: "flex", gap: 8 }}>
          {(["front", "back", "close_up"] as const).map((role) => {
            const covered = report.coverage?.[role] ?? false;
            return (
              <div
                key={role}
                style={{
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: 600,
                  background: covered ? "var(--pass-bg)" : "var(--surface-2)",
                  color: covered ? "var(--pass)" : "var(--text-tertiary)",
                  border: `1px solid ${covered ? "var(--pass)" : "var(--border)"}`,
                }}
              >
                {covered ? "✓" : "○"} {role.replace("_", "-")}
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Link href={`/inspections/${id}/audit`} className="btn btn-ghost" style={{ fontSize: 13 }}>
            Audit trail →
          </Link>
        </div>
      </div>

      {/* ── Field results ── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Field Results</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {report.field_results.map((fr) => {
            const ev = fr.evidence;
            return (
              <div
                key={fr.field_name}
                className="card"
                style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start" }}
              >
                {/* Field + decision */}
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>
                    {FIELD_LABELS[fr.field_name] ?? fr.field_name}
                  </div>
                  <DecisionBadge decision={fr.decision} />
                </div>

                {/* Evidence details */}
                <div style={{ flex: 1, fontSize: 13, display: "grid", gridTemplateColumns: "auto 1fr", gap: "3px 12px" }}>
                  <span style={{ color: "var(--text-tertiary)" }}>State</span>
                  <span>{STATE_LABEL[ev.state] ?? ev.state}</span>

                  <span style={{ color: "var(--text-tertiary)" }}>Value</span>
                  <span style={{ fontFamily: "var(--font-mono)" }}>{ev.value ?? "—"}</span>

                  {ev.ocr_confidence != null && (
                    <>
                      <span style={{ color: "var(--text-tertiary)" }}>Confidence</span>
                      <span>{(ev.ocr_confidence * 100).toFixed(0)}%</span>
                    </>
                  )}

                  {ev.ocr_engine && (
                    <>
                      <span style={{ color: "var(--text-tertiary)" }}>Engine</span>
                      <span>{ev.ocr_engine}</span>
                    </>
                  )}

                  {ev.image_quality && (
                    <>
                      <span style={{ color: "var(--text-tertiary)" }}>Image quality</span>
                      <span>{ev.image_quality}</span>
                    </>
                  )}

                  {ev.candidates && ev.candidates.length > 0 && (
                    <>
                      <span style={{ color: "var(--text-tertiary)" }}>Conflict readings</span>
                      <span style={{ color: "var(--review)" }}>{ev.candidates.join(" vs ")}</span>
                    </>
                  )}

                  {ev.bbox && (
                    <>
                      <span style={{ color: "var(--text-tertiary)" }}>BBox</span>
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                        [{ev.bbox.join(", ")}]
                      </span>
                    </>
                  )}

                  <span style={{ color: "var(--text-tertiary)" }}>Rule</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {fr.rule_id} ({fr.rule_version})
                  </span>
                </div>

                {/* Reason */}
                <div
                  style={{
                    minWidth: 240,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                    fontStyle: "italic",
                    padding: "8px 12px",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius)",
                  }}
                >
                  {fr.reason}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Override form ── */}
      <div className="card" style={{ borderColor: "var(--review)" }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
          Supervisor Override
        </h2>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16 }}>
          Creates a linked ReviewRecord. The original report is never modified
          (CONTRACTS.md #7).
        </p>
        <OverrideForm inspectionId={id} />
      </div>
    </div>
  );
}
