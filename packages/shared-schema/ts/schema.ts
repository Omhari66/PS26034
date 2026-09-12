/**
 * TypeScript mirror of packages/shared-schema/compliance_engine.py
 *
 * AUTO-GENERATED EQUIVALENT — do NOT add values here independently.
 * If you change EvidenceState or Decision in compliance_engine.py,
 * update this file to match. String values must be identical.
 *
 * Canonical source: packages/shared-schema/compliance_engine.py
 * See ARCHITECTURE.md for the authoritative path reference.
 */

// ---------------------------------------------------------------------------
// Evidence states — mirrors EvidenceState(str, Enum) in compliance_engine.py
// ---------------------------------------------------------------------------

export const EvidenceState = {
  /** Value extracted, single consistent reading. */
  FOUND: "FOUND",
  /** Searched, sufficient coverage, nothing there. */
  NOT_FOUND: "NOT_FOUND",
  /** Insufficient coverage / image quality to say. */
  NOT_VERIFIABLE: "NOT_VERIFIABLE",
  /** Multiple disagreeing readings. */
  CONFLICTING: "CONFLICTING",
} as const;

export type EvidenceState = (typeof EvidenceState)[keyof typeof EvidenceState];

// ---------------------------------------------------------------------------
// Decision — mirrors Decision(str, Enum) in compliance_engine.py
// ---------------------------------------------------------------------------

export const Decision = {
  PASS: "PASS",
  FAIL: "FAIL",
  REVIEW: "REVIEW",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  CATEGORY_NOT_SUPPORTED: "CATEGORY_NOT_SUPPORTED",
} as const;

export type Decision = (typeof Decision)[keyof typeof Decision];

// ---------------------------------------------------------------------------
// Evidence object shape — mirrors FieldEvidence dataclass
// ---------------------------------------------------------------------------

export interface FieldEvidence {
  field_name: string;
  state: EvidenceState;
  value?: string | null;
  source_image?: string | null;
  /** [x1, y1, x2, y2] in original image coordinates */
  bbox?: [number, number, number, number] | null;
  ocr_engine?: string | null;
  ocr_confidence?: number | null;
  secondary_value?: string | null;
  image_quality?: "high" | "medium" | "low" | null;
  /** For CONFLICTING: all raw readings seen */
  candidates?: string[];
  /** Gap 2: True when secondary engine was unavailable */
  single_engine_only?: boolean;
}

// ---------------------------------------------------------------------------
// Rule result — mirrors RuleResult dataclass
// ---------------------------------------------------------------------------

export interface RuleResult {
  rule_id: string;
  rule_version: string;
  field_name: string;
  decision: Decision;
  reason: string;
  evidence: FieldEvidence;
}

// ---------------------------------------------------------------------------
// Inspection report — mirrors InspectionReport dataclass
// ---------------------------------------------------------------------------

export interface InspectionReport {
  inspection_id: string;
  product_id: string;
  category: string;
  rule_version: string;
  field_results: RuleResult[];
  overall_decision: Decision;
  coverage: {
    front: boolean;
    back: boolean;
    close_up: boolean;
  };
}
