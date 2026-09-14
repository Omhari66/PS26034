"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  fetchInspections,
  InspectionListOut,
  AuthError,
  getToken,
  logout,
} from "../lib/api";
import { InspectionTable } from "../components/InspectionTable";

function HomePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const decision = searchParams.get("decision") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const inspector_id = searchParams.get("inspector_id") ?? undefined;

  const [data, setData] = useState<InspectionListOut | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Guard: if no token, send to login
    if (!getToken()) {
      router.replace("/login");
      return;
    }
    setLoading(true);
    setError(null);
    fetchInspections({ decision, category, inspector_id })
      .then(setData)
      .catch((e) => {
        if (e instanceof AuthError) {
          logout();
        } else {
          setError((e as Error).message);
        }
      })
      .finally(() => setLoading(false));
  }, [decision, category, inspector_id, router]);

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800 }}>All Inspections</h1>
          {data && (
            <p style={{ color: "var(--text-secondary)", marginTop: 4 }}>
              {data.total} total
            </p>
          )}
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["PASS", "FAIL", "REVIEW"] as const).map((d) => (
            <a
              key={d}
              href={decision === d ? "/" : `/?decision=${d}`}
              className={`btn ${decision === d ? "btn-primary" : "btn-ghost"}`}
              style={{ fontSize: 12 }}
            >
              {d}
            </a>
          ))}
          {(decision || category || inspector_id) && (
            <a href="/" className="btn btn-ghost" style={{ fontSize: 12, color: "var(--fail)" }}>
              ✕ Clear
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      {loading && (
        <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
          Loading…
        </div>
      )}

      {!loading && error && (
        <div className="card" style={{ borderColor: "var(--fail)", color: "var(--fail)" }}>
          <strong>Backend error:</strong> {error}
          <p style={{ marginTop: 8, fontSize: 13, color: "var(--text-secondary)" }}>
            Is the backend running? Set NEXT_PUBLIC_API_URL if needed.
          </p>
        </div>
      )}

      {!loading && !error && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <InspectionTable items={data?.items ?? []} />
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>Loading…</div>}>
      <HomePageContent />
    </Suspense>
  );
}
