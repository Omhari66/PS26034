import { Decision, EvidenceState, FieldEvidence, RuleResult, InspectionReport } from "../../../../packages/shared-schema/ts/schema";

export type { Decision, EvidenceState, FieldEvidence, RuleResult, InspectionReport };

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

export interface ReviewRecordOut {
  id: string;
  inspection_id: string;
  reviewer_id: string;
  overridden_decision: Decision;
  reason: string;
  original_decision: Decision;
  created_at: string;
}

export interface AuditTrailOut {
  inspection: InspectionReport;
  reviews: ReviewRecordOut[];
}

export interface InspectionImageMeta {
  id: string;
  inspection_id: string;
  role: "front" | "back" | "close_up" | string;
  quality: "high" | "medium" | "low" | string;
  accepted: boolean;
  url: string;
  original_width: number | null;
  original_height: number | null;
}

export interface DecisionQualityFieldTrigger {
  field_name: string;
  review_count: number;
  percentage: number;
}

export interface DecisionQualityAnalytics {
  total_inspections: number;
  review_count: number;
  review_rate_percentage: number;
  overridden_reviews_count: number;
  confirmed_reviews_count: number;
  override_rate_percentage: number;
  decision_counts: Record<string, number>;
  top_review_trigger_fields: DecisionQualityFieldTrigger[];
}
