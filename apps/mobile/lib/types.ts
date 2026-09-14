/**
 * TypeScript types mirroring the backend API shapes.
 * Kept in sync with packages/shared-schema/ts/schema.ts by hand.
 * See ARCHITECTURE.md: "if these ever drift, that is a bug."
 */

// ─── Evidence & decision ────────────────────────────────────────────────────

export type EvidenceState =
  | 'FOUND'
  | 'NOT_FOUND'
  | 'NOT_VERIFIABLE'
  | 'CONFLICTING';

export type Decision =
  | 'PASS'
  | 'FAIL'
  | 'REVIEW'
  | 'NOT_APPLICABLE'
  | 'CATEGORY_NOT_SUPPORTED';

// ─── Report shapes (mirrors InspectionReportOut) ────────────────────────────

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
  correction?: FieldCorrection;
}

export interface FieldCorrection {
  field_name: string;
  action: 'confirmed' | 'corrected' | 'marked_absent';
  value?: string | null;
  reviewer_id: string;
  acknowledged: boolean;
}

export interface InspectionReport {
  inspection_id: string;
  category: string;
  rule_version: string;
  field_results: RuleResult[];
  overall_decision: Decision;
  coverage: { front: boolean; back: boolean; close_up: boolean };
}

export interface AnalyzeInspectionResponse {
  rule_version: string;
  field_results: RuleResult[];
  category_mismatch: boolean;
}

// ─── Request / response shapes ───────────────────────────────────────────────

export interface CreateInspectionResponse {
  inspection_id: string;
  status: 'capturing';
}

export interface ImageUploadResponse {
  image_id: string;
  role: ImageRole;
  quality: ImageQuality;
  accepted: boolean;
  reason: string;
}

export interface SetCategoryResponse {
  inspection_id: string;
  category: string;
}

// ─── App-level types ─────────────────────────────────────────────────────────

export type ImageRole = 'front' | 'back' | 'close_up';
export type ImageQuality = 'high' | 'medium' | 'low';

/** One captured image in the local capture flow (before upload). */
export interface CapturedImage {
  role: ImageRole;
  localUri: string;          // file:// URI from camera/picker
  phash?: string;            // 64-bit DCT perceptual hash
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'failed'; // sync/upload status
  uploadError?: string;      // error message if upload failed
  uploadResponse?: ImageUploadResponse; // set after successful upload
}

/** App-level inspection session (held in state across screens). */
export interface InspectionSession {
  inspectionId: string;
  category: string | null;
  images: CapturedImage[];
  draftReport: AnalyzeInspectionResponse | null;
  report: InspectionReport | null;
}
