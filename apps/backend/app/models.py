"""
SQLAlchemy ORM models for PS 26034.

Append-only contract (AGENTS.md rule 5, CONTRACTS.md #7):
  - Never UPDATE or DELETE an existing Inspection or FieldResult row.
  - Corrections happen by creating a new Inspection referencing the old one.

Decision and EvidenceState values are stored as plain strings matching the
enum values defined in packages/shared-schema/compliance_engine.py — that
file is the single source of truth.
"""

import uuid
from datetime import UTC, datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.db import Base


def _new_uuid() -> str:
    return str(uuid.uuid4())


def _now_utc() -> datetime:
    return datetime.now(UTC)


class Inspection(Base):
    """
    One inspection session. Created by POST /inspections, completed by
    POST /inspections/{id}/submit. Append-only after creation.
    """

    __tablename__ = "inspections"

    id = Column(String, primary_key=True, default=_new_uuid)
    inspector_id = Column(String, nullable=False)

    # "capturing" → "submitted" (one-way; never goes backward)
    status = Column(String, nullable=False, default="capturing")

    # Set via POST /inspections/{id}/category before submission
    category = Column(String, nullable=True)

    # Stamped at submit time from the active rule set
    rule_version = Column(String, nullable=True)

    # Overall Decision enum value, e.g. "PASS" / "FAIL" / "REVIEW"
    overall_decision = Column(String, nullable=True)

    # {"front": bool, "back": bool, "close_up": bool}
    coverage = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now_utc)

    field_results = relationship(
        "FieldResult",
        back_populates="inspection",
        lazy="joined",
        order_by="FieldResult.field_name",
    )
    images = relationship(
        "InspectionImage",
        back_populates="inspection",
        lazy="select",
        order_by="InspectionImage.created_at",
    )
    reviews = relationship(
        "ReviewRecord",
        back_populates="inspection",
        lazy="select",
        order_by="ReviewRecord.created_at",
    )


class FieldResult(Base):
    """
    One rule result for one field within one inspection.
    Contains a JSON blob of the full FieldEvidence so the evidence viewer
    can reconstruct the complete traceable chain (image + bbox + OCR).
    Append-only — never mutated after creation.
    """

    __tablename__ = "field_results"

    id = Column(String, primary_key=True, default=_new_uuid)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)

    rule_id = Column(String, nullable=False)  # e.g. "LM-MRP-001"
    rule_version = Column(String, nullable=False)  # e.g. "v1.0"
    field_name = Column(String, nullable=False)  # e.g. "mrp"
    decision = Column(String, nullable=False)  # Decision enum value
    reason = Column(String, nullable=False)

    # Full FieldEvidence serialized as JSON for the evidence viewer
    # Structure matches packages/shared-schema/ts/schema.ts#FieldEvidence
    evidence_json = Column(JSON, nullable=False)

    # Phase 3.5: Structured field-level correction (Gap 9, 10).
    # Stores the FieldCorrection dict if the inspector intervened before submission.
    correction_json = Column(JSON, nullable=True)

    inspection = relationship("Inspection", back_populates="field_results")


class InspectionImage(Base):
    """
    One uploaded image for an inspection (Phase 2+).

    Append-only: images are never deleted because they form part of the
    evidence chain. The file_path is absolute and must remain accessible
    for as long as the inspection record exists.

    In production, replace file_path with an object-storage URI (S3/GCS).
    # TODO(phase5): swap local file_path for object-storage URI.
    """

    __tablename__ = "inspection_images"

    id = Column(String, primary_key=True, default=_new_uuid)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)

    # front | back | close_up
    role = Column(String, nullable=False)

    # CONTRACTS.md #1 output: quality + accepted gate
    quality = Column(String, nullable=False)  # "high" | "medium" | "low"
    accepted = Column(Boolean, nullable=False)  # only accepted images go to OCR

    # Absolute path to the stored image file (local disk for dev/demo)
    file_path = Column(String, nullable=False)

    # Original dimensions — needed to reconstruct correct coordinate space
    original_width = Column(Integer, nullable=True)
    original_height = Column(Integer, nullable=True)

    # Quality scorer details (stored for Phase 5 threshold calibration)
    sharpness = Column(String, nullable=True)  # stored as string, avoid Float precision
    brightness = Column(String, nullable=True)
    quality_reason = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), default=_now_utc)

    inspection = relationship("Inspection", back_populates="images")


class ReviewRecord(Base):
    """
    Supervisor override record — CONTRACTS.md #7 / AGENTS.md rule 5.

    A ReviewRecord NEVER modifies the original Inspection or its FieldResults.
    It is a separate append-only row that references the original inspection
    and captures the supervisor's decision + reasoning.

    Multiple ReviewRecords can exist for one Inspection (e.g., second opinion).
    The audit trail is: original report + all ReviewRecords in created_at order.
    """

    __tablename__ = "review_records"

    id = Column(String, primary_key=True, default=_new_uuid)
    inspection_id = Column(String, ForeignKey("inspections.id"), nullable=False)

    # Supervisor who performed the review
    reviewer_id = Column(String, nullable=False)

    # The override decision — must be one of the Decision enum values
    overridden_decision = Column(String, nullable=False)

    # Mandatory free-text reason (no silent overrides)
    reason = Column(String, nullable=False)

    # Original overall_decision at review time — preserved for audit comparison
    original_decision = Column(String, nullable=False)

    created_at = Column(DateTime(timezone=True), default=_now_utc)

    inspection = relationship("Inspection", back_populates="reviews")
