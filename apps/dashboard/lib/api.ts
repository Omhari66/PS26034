/**
 * Typed API client for the PS 26034 backend — dashboard (server-side + client-side).
 * Mirrors apps/mobile/lib/api.ts but adapted for Next.js server components and SWR.
 */

export const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Decision =
  | "PASS"
  | "FAIL"
  | "REVIEW"
  | "NOT_APPLICABLE"
  | "CATEGORY_NOT_SUPPORTED";

export type EvidenceState =
  | "FOUND"
  | "NOT_FOUND"
  | "NOT_VERIFIABLE"
  | "CONFLICTING";

export interface FieldEvidence {
  field_name: string;
  state: EvidenceState;
  value: string | null;
  source_image: string | null;
  bbox: [number, number, number, number] | null;
  ocr_engine: string | null;
  ocr_confidence: number | null;
  secondary_value: string | null;
  image_quality: string | null;
  candidates: string[];
}

export interface RuleResult {
  rule_id: string;
  rule_version: string;
  field_name: string;
  decision: Decision;
  reason: string;
  evidence: FieldEvidence;
}

export interface InspectionReport {
  inspection_id: string;
  category: string;
  rule_version: string;
  field_results: RuleResult[];
  overall_decision: Decision;
  coverage: { front: boolean; back: boolean; close_up: boolean };
}

export interface ReviewRecord {
  id: string;
  inspection_id: string;
  reviewer_id: string;
  overridden_decision: Decision;
  reason: string;
  original_decision: Decision;
  created_at: string;
}

export interface AuditTrail {
  inspection: InspectionReport;
  reviews: ReviewRecord[];
}

export interface InspectionListItem {
  inspection_id: string;
  inspector_id: string;
  category: string | null;
  overall_decision: Decision | null;
  rule_version: string | null;
  status: string;
  created_at: string;
  has_reviews: boolean;
}

export interface InspectionListOut {
  items: InspectionListItem[];
  total: number;
}

export interface ReviewRequest {
  overridden_decision: Decision;
  reason: string;
  reviewer_id: string;
}

// ─── Token helpers (client-side only) ───────────────────────────────────────

/** Safe wrapper — returns null when called from SSR (no window). */
function ss(key: string): string | null {
  if (typeof window === "undefined" || typeof sessionStorage === "undefined")
    return null;
  return sessionStorage.getItem(key);
}

export function getToken(): string | null {
  return ss("ps26034_token");
}

export function getRole(): string | null {
  return ss("ps26034_role");
}

export function getEmail(): string | null {
  return ss("ps26034_email");
}

export function logout() {
  // No-op on server (should only be called from client components).
  if (typeof window === "undefined") return;
  sessionStorage.removeItem("ps26034_token");
  sessionStorage.removeItem("ps26034_role");
  sessionStorage.removeItem("ps26034_email");
  window.location.href = "/login";
}

// ─── Fetcher (used by SWR / client components) ────────────────────────────────

export class AuthError extends Error {
  constructor() {
    super("Unauthenticated");
    this.name = "AuthError";
  }
}

export async function fetcher<T>(path: string): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, {
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    if (res.status === 401) {
      // Throw a typed error — the client component decides whether to redirect.
      throw new AuthError();
    }
    const body = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(JSON.stringify(body));
  }
  return res.json();
}

// ─── Server-side fetch helpers (used in async Server Components) ──────────────

export async function fetchInspections(
  params: Record<string, string | undefined> = {}
): Promise<InspectionListOut> {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined) as [
        string,
        string,
      ][]
    )
  ).toString();
  return fetcher<InspectionListOut>(`/inspections${qs ? `?${qs}` : ""}`);
}

export async function fetchReport(id: string): Promise<InspectionReport> {
  return fetcher<InspectionReport>(`/inspections/${id}`);
}

export async function fetchAuditTrail(id: string): Promise<AuditTrail> {
  return fetcher<AuditTrail>(`/inspections/${id}/audit`);
}

export async function submitReview(
  id: string,
  body: ReviewRequest
): Promise<ReviewRecord> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}/inspections/${id}/review`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}
