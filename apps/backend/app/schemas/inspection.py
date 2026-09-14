"""
Pydantic request and response schemas for the inspection API.

EvidenceState and Decision are imported from packages.shared_schema —
the single source of truth. Never redefine them here.

The SubmitInspectionRequest is a Phase 1 convenience: it accepts
field_evidences directly in the request body (no OCR pipeline yet).
In Phase 2, this field is replaced by the real OCR pipeline output.
"""

from datetime import datetime
from typing import Literal

# EvidenceState and Decision are str Enums; Pydantic validates them from strings.
# sys.path is patched by main.py before any app imports run.
from packages.shared_schema import Decision, EvidenceState  # noqa: E402
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Evidence and result shapes — mirror compliance_engine.py dataclasses
# ---------------------------------------------------------------------------


class FieldEvidenceIn(BaseModel):
    """
    Represents OCR + evidence for one packaging field.
    In Phase 1, populated manually (hand-crafted fixtures).
    In Phase 2+, produced by the OCR pipeline.
    """

    field_name: str
    state: EvidenceState
    value: str | None = None
    source_image: str | None = None
    # (x1, y1, x2, y2) in original image pixel coordinates
    bbox: tuple[int, int, int, int] | None = None
    ocr_engine: str | None = None
    ocr_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    secondary_value: str | None = None
    image_quality: Literal["high", "medium", "low"] | None = None
    # For CONFLICTING: all raw readings observed
    candidates: list[str] = Field(default_factory=list)
    # Gap 2: True when secondary engine was unavailable; caps result at REVIEW
    single_engine_only: bool = False


class FieldEvidenceOut(BaseModel):
    """Evidence returned in inspection reports — same shape as FieldEvidenceIn."""

    field_name: str
    state: EvidenceState
    value: str | None = None
    source_image: str | None = None
    bbox: tuple[int, int, int, int] | None = None
    ocr_engine: str | None = None
    ocr_confidence: float | None = None
    secondary_value: str | None = None
    image_quality: str | None = None
    candidates: list[str] = Field(default_factory=list)
    # Gap 2: reflects whether secondary engine was available for this field
    single_engine_only: bool = False


class RuleResultOut(BaseModel):
    rule_id: str
    rule_version: str
    field_name: str
    decision: Decision
    reason: str
    evidence: FieldEvidenceOut
    correction: "FieldCorrection | None" = None


class InspectionReportOut(BaseModel):
    inspection_id: str
    category: str
    rule_version: str
    field_results: list[RuleResultOut]
    overall_decision: Decision
    coverage: dict


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class CreateInspectionRequest(BaseModel):
    inspector_id: str


class SetCategoryRequest(BaseModel):
    category: str


class SubmitInspectionRequest(BaseModel):
    """
    Phase 1 only: field_evidences accepted directly so the rule engine
    can be exercised without an OCR pipeline.

    # TODO(stub): In Phase 2, remove field_evidences from this schema.
    # The submit endpoint will instead trigger OCR → extraction → applicability
    # → rule engine without accepting pre-built evidence from the client.
    """

    coverage: dict = Field(
        default_factory=dict,
        description='{"front": bool, "back": bool, "close_up": bool}',
    )
    field_evidences: list[FieldEvidenceIn] = Field(
        default_factory=list,
        description=(
            "Phase 1 only — hand-crafted FieldEvidence objects. "
            "Omit when using uploaded images (Phase 2+)."
        ),
    )
    corrections: list["FieldCorrection"] = Field(
        default_factory=list,
        description="Phase 3.5: Inspector resolutions for REVIEW fields.",
    )


class FieldCorrection(BaseModel):
    """
    Structured field-level correction (Gap 9).
    Must be provided for any field flagged as REVIEW before submission is allowed (Gap 10).
    """

    field_name: str
    action: Literal["confirmed", "corrected", "marked_absent", "escalated"]
    ai_value: str | None = None
    corrected_value: str | None = None
    reviewer_id: str
    acknowledged: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class AnalyzeResponse(BaseModel):
    """
    Phase 3.5: Response for POST /inspections/{id}/analyze
    Returns draft OCR results and rule engine evaluation plus category sanity check,
    but does NOT persist the final report.
    """

    inspection_id: str
    category: str
    rule_version: str
    field_results: list[RuleResultOut]
    category_mismatch: bool
    category_mismatch_warning: str | None = None


# ---------------------------------------------------------------------------
# Response schemas for non-report endpoints
# ---------------------------------------------------------------------------


class CreateInspectionResponse(BaseModel):
    inspection_id: str
    status: str


class SetCategoryResponse(BaseModel):
    inspection_id: str
    category: str


class ImageUploadResponse(BaseModel):
    image_id: str
    role: str
    quality: str  # "high" | "medium" | "low"
    accepted: bool
    reason: str  # Human-readable quality note


# ---------------------------------------------------------------------------
# Phase 5 — Review, audit trail, and list schemas
# ---------------------------------------------------------------------------


class ReviewRequest(BaseModel):
    """
    POST /inspections/{id}/review — supervisor override.
    Creates a ReviewRecord; never edits the original report.
    CONTRACTS.md #7 / AGENTS.md rule 5.
    """

    overridden_decision: Decision
    reason: str = Field(..., min_length=10, description="Mandatory explanation (≥10 chars)")
    reviewer_id: str


class ReviewRecordOut(BaseModel):
    """One supervisor review / override record."""

    id: str
    inspection_id: str
    reviewer_id: str
    overridden_decision: Decision
    reason: str
    original_decision: Decision
    created_at: str  # ISO-8601


class AuditTrailOut(BaseModel):
    """Full audit trail: original report + all review records in order."""

    inspection: InspectionReportOut
    reviews: list[ReviewRecordOut]


class InspectionListItem(BaseModel):
    """Summary row for the dashboard inspection list."""

    inspection_id: str
    inspector_id: str
    category: str | None
    overall_decision: Decision | None
    rule_version: str | None
    status: str
    created_at: str  # ISO-8601
    has_reviews: bool


class InspectionListOut(BaseModel):
    """Paginated inspection list response."""

    items: list[InspectionListItem]
    total: int
