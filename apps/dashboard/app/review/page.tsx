"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchInspections,
  InspectionListOut,
  AuthError,
  getToken,
  logout,
} from "../../lib/api";
import { InspectionTable } from "../../components/InspectionTable";

export default function ReviewQueuePage() {
  const router = useRouter();
  const [data, setData] = useState<InspectionListOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    fetchInspections({ decision: "REVIEW" })
      .then(setData)
      .catch((e) => {
        if (e instanceof AuthError) {
          logout();
        } else {
          setError((e as Error).message);
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>
          <span style={{ color: "var(--review)" }}>?</span> REVIEW Queue
        </h1>
        <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
          Inspections flagged for supervisor review — conflicting evidence,
          low confidence, or unverifiable fields.
          {data && <strong style={{ color: "var(--review)" }}> {data.total} pending</strong>}
        </p>
      </div>

      {loading && (
        <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          Loading…
        </div>
      )}

      {!loading && data?.total === 0 && !error && (
        <div
          className="card"
          style={{
            textAlign: "center",
            padding: "60px 0",
            borderColor: "var(--pass)",
            background: "var(--pass-bg)",
          }}
        >
          <p style={{ fontSize: 20, fontWeight: 700, color: "var(--pass)" }}>
            ✓ Queue is clear
          </p>
          <p style={{ color: "var(--text-secondary)", marginTop: 8 }}>
            No inspections require review at this time.
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ borderColor: "var(--fail)", color: "var(--fail)" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && data && data.total > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <InspectionTable items={data.items} />
        </div>
      )}
    </div>
  );
}
