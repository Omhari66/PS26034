"""
Inspection service — orchestrates the rule engine for one inspection.

This module:
  - Implements a minimal applicability check (Phase 1; replaced in Phase 4).
  - Converts Pydantic FieldEvidenceIn → FieldEvidence dataclass.
  - Calls evaluate_field / aggregate_overall (pure functions, no LLM/network).
  - Persists results to the DB.
  - Reads inspection reports back from the DB.

Module boundary (CONTRACTS.md #5):
  This service MUST NOT call an LLM, call OCR, or access the UI.
  evaluate_field and aggregate_overall are pure functions — same input,
  same output, always.
"""

import dataclasses
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.schemas.inspection import AuditTrailOut, InspectionListOut, ReviewRecordOut

from packages.shared_schema import (  # noqa: E402
    Decision,
    EvidenceState,
    FieldEvidence,
    aggregate_overall,
    evaluate_field,
)
from sqlalchemy.orm import Session

from app.models import FieldResult, Inspection
from app.schemas.inspection import (
    FieldEvidenceIn,
    FieldEvidenceOut,
    InspectionReportOut,
    RuleResultOut,
)

# ---------------------------------------------------------------------------
# Phase 4: applicability engine (replaces Phase 1 hard-coded constants)
# ---------------------------------------------------------------------------
from app.services.applicability import (  # noqa: E402
    CURRENT_RULE_VERSION,
    get_rules,
)

# Convenience alias so callers can use RULE_VERSION without importing applicability.
RULE_VERSION = CURRENT_RULE_VERSION


# ---------------------------------------------------------------------------
# Helpers — evidence conversion
# ---------------------------------------------------------------------------


def _evidence_in_to_dataclass(ev_in: FieldEvidenceIn) -> FieldEvidence:
    """Convert a Pydantic FieldEvidenceIn to the shared-schema FieldEvidence dataclass."""
    return FieldEvidence(
        field_name=ev_in.field_name,
        state=ev_in.state,
        value=ev_in.value,
        source_image=ev_in.source_image,
        bbox=ev_in.bbox,
        ocr_engine=ev_in.ocr_engine,
        ocr_confidence=ev_in.ocr_confidence,
        secondary_value=ev_in.secondary_value,
        image_quality=ev_in.image_quality,
        candidates=list(ev_in.candidates),
        # Gap 2: carry the single-engine flag through the conversion
        single_engine_only=getattr(ev_in, "single_engine_only", False),
    )


def _evidence_to_json(ev: FieldEvidence) -> dict:
    """
    Serialize a FieldEvidence dataclass to a JSON-compatible dict.
    bbox is stored as a list (JSON arrays) so it round-trips cleanly.
    """
    d = dataclasses.asdict(ev)
    # EvidenceState is a str-Enum; asdict gives the .value string, which is fine.
    return d


def _evidence_from_json(d: dict) -> FieldEvidenceOut:
    """
    Deserialize a stored evidence_json dict to the FieldEvidenceOut schema.
    Restores bbox from list → tuple if present.
    """
    bbox_raw = d.get("bbox")
    bbox = tuple(bbox_raw) if bbox_raw is not None else None  # type: ignore[assignment]
    return FieldEvidenceOut(
        field_name=d["field_name"],
        state=EvidenceState(d["state"]),
        value=d.get("value"),
        source_image=d.get("source_image"),
        bbox=bbox,
        ocr_engine=d.get("ocr_engine"),
        ocr_confidence=d.get("ocr_confidence"),
        secondary_value=d.get("secondary_value"),
        image_quality=d.get("image_quality"),
        candidates=d.get("candidates", []),
        # Gap 2: round-trip the single-engine flag through serialization
        single_engine_only=d.get("single_engine_only", False),
    )


# ---------------------------------------------------------------------------
# Report completeness guarantee (Gap 11, CONTRACTS.md §7)
# ---------------------------------------------------------------------------


def _assert_report_complete(field_results: list) -> None:
    """
    Raise ValueError if any field with state=FOUND has no extracted value in
    the results. This catches template/serialization bugs before they produce
    a report with a silently blank required field.

    CONTRACTS.md §7: report generation must fail loudly, not silently render
    'Not available' for a field that the system actually extracted.
    """
    for result in field_results:
        evidence = getattr(result, "evidence", None)
        if evidence is None:
            continue
        state = getattr(evidence, "state", None)
        value = getattr(evidence, "value", None)
        if state in (EvidenceState.FOUND, "FOUND") and value is None:
            raise ValueError(
                f"Report completeness failure: field '{evidence.field_name}' "
                f"has state=FOUND but extracted_value is None. "
                "This is a template or mapping bug — check _evidence_in_to_dataclass "
                "and the OCR extraction pipeline."
            )


# ---------------------------------------------------------------------------
# CRUD helpers
# ---------------------------------------------------------------------------


def create_inspection(db: Session, inspector_id: str) -> Inspection:
    """Create a new inspection in 'capturing' status. Append-only from here."""
    inspection = Inspection(inspector_id=inspector_id, status="capturing")
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection


def set_category(
    db: Session, inspection_id: str, category: str
) -> Inspection | None:
    """Set the inspector-confirmed category. Required before submission."""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None:
        return None
    inspection.category = category
    db.commit()
    db.refresh(inspection)
    return inspection


def get_inspection(db: Session, inspection_id: str) -> Inspection | None:
    return db.query(Inspection).filter(Inspection.id == inspection_id).first()


# ---------------------------------------------------------------------------
# Applicability check (Phase 4 — driven by applicability engine)
# ---------------------------------------------------------------------------


def _make_category_not_supported_result(
    category: str,
    rule_version: str,
) -> FieldResult:
    """
    Synthetic FieldResult for unsupported categories.
    rule_version is passed in rather than hard-coded so old reports can
    reconstruct the exact version they were evaluated under.
    """
    evidence = FieldEvidence(
        field_name="category",
        state=EvidenceState.NOT_VERIFIABLE,
    )
    return FieldResult(
        rule_id="LM-CATEGORY-001",
        rule_version=rule_version,
        field_name="category",
        decision=Decision.CATEGORY_NOT_SUPPORTED.value,
        reason=f"Category '{category}' is not supported in rule version {rule_version}.",
        evidence_json=_evidence_to_json(evidence),
    )


# ---------------------------------------------------------------------------
# Submit — run rule engine, persist report
# ---------------------------------------------------------------------------


def submit_inspection(
    db: Session,
    inspection_id: str,
    field_evidences_in: list[FieldEvidenceIn],
    coverage: dict,
    corrections: list["FieldCorrection"] | None = None,
) -> InspectionReportOut | None:
    """
    Run the rule engine on the submitted evidence and store the report.

    Pure-function contract (CONTRACTS.md #5):
      - evaluate_field and aggregate_overall are called with no side effects.
      - No LLM calls, no network calls, no randomness inside this function.
    """
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None:
        return None

    category = inspection.category or ""
    field_result_rows: list[FieldResult] = []

    # --- Phase 4: real applicability check via versioned rule table ---
    # Always stamp the CURRENT_RULE_VERSION at submit time.
    # Old reports in the DB keep their stored rule_version intact (append-only).
    active_version = CURRENT_RULE_VERSION
    category_rules = get_rules(category, rule_version=active_version)

    if not category_rules.supported:
        row = _make_category_not_supported_result(category, active_version)
        row.inspection_id = inspection_id
        field_result_rows.append(row)
        overall = Decision.CATEGORY_NOT_SUPPORTED
    else:
        # Build lookup: field → FieldRule (rule_id, required flag)
        field_rule_lookup = {fr.field: fr for fr in category_rules.fields}

        # --- Run evaluate_field for each submitted evidence ---
        rule_results = []
        for ev_in in field_evidences_in:
            ev_dc = _evidence_in_to_dataclass(ev_in)
            fr = field_rule_lookup.get(ev_in.field_name)
            rule_id = fr.rule_id if fr else f"LM-UNKNOWN-{ev_in.field_name}"
            required = fr.required if fr else False
            rr = evaluate_field(
                ev_dc, rule_id, active_version,
                required=required,
                coverage=coverage,   # ← D8 fix: pass coverage so NOT_FOUND + incomplete → REVIEW
            )

            rule_results.append(rr)

        # Apply corrections and validate Gap 10 (no unacknowledged REVIEW fields)
        correction_map = {c.field_name: c for c in (corrections or [])}
        for rr in rule_results:
            if rr.decision == Decision.REVIEW:
                corr = correction_map.get(rr.field_name)
                if not corr or not corr.acknowledged:
                    from fastapi import HTTPException, status
                    raise HTTPException(
                        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                        detail={
                            "code": "UNACKNOWLEDGED_REVIEW",
                            "message": f"Field '{rr.field_name}' flagged as REVIEW but lacks an acknowledged correction.",
                        },
                    )
                # Apply the structured correction
                if corr.action == "confirmed":
                    rr.decision = Decision.PASS
                    rr.reason = f"AI value confirmed by inspector {corr.reviewer_id}"
                elif corr.action == "corrected":
                    rr.decision = Decision.PASS
                    rr.reason = f"Value corrected by inspector {corr.reviewer_id}"
                elif corr.action == "marked_absent":
                    rr.decision = Decision.FAIL
                    rr.reason = f"Field marked genuinely absent by inspector {corr.reviewer_id}"

            corr = correction_map.get(rr.field_name)
            row = FieldResult(
                inspection_id=inspection_id,
                rule_id=rr.rule_id,
                rule_version=rr.rule_version,
                field_name=rr.field_name,
                decision=rr.decision.value,
                reason=rr.reason,
                evidence_json=_evidence_to_json(rr.evidence),
                correction_json=corr.model_dump(mode="json") if corr else None,
            )
            field_result_rows.append(row)

        overall = aggregate_overall(rule_results)

        # Gap 11: fail loudly if any FOUND field rendered with no value
        # (catches template/mapping bugs before they reach the DB)
        _assert_report_complete(rule_results)

    # --- Persist (append-only) ---
    inspection.rule_version = RULE_VERSION
    inspection.overall_decision = overall.value
    inspection.coverage = coverage
    inspection.status = "submitted"

    for row in field_result_rows:
        db.add(row)

    db.commit()
    db.refresh(inspection)

    return _inspection_to_report(inspection)


# ---------------------------------------------------------------------------
# Report reconstruction
# ---------------------------------------------------------------------------


def _inspection_to_report(inspection: Inspection) -> InspectionReportOut:
    """Build an InspectionReportOut from a fully-loaded Inspection ORM row."""
    from app.schemas.inspection import FieldCorrection  # noqa: PLC0415
    field_results_out = []
    for fr in inspection.field_results:
        evidence_out = _evidence_from_json(fr.evidence_json)
        corr_out = FieldCorrection(**fr.correction_json) if fr.correction_json else None
        field_results_out.append(
            RuleResultOut(
                rule_id=fr.rule_id,
                rule_version=fr.rule_version,
                field_name=fr.field_name,
                decision=Decision(fr.decision),
                reason=fr.reason,
                evidence=evidence_out,
                correction=corr_out,
            )
        )

    return InspectionReportOut(
        inspection_id=inspection.id,
        category=inspection.category or "",
        rule_version=inspection.rule_version or RULE_VERSION,
        field_results=field_results_out,
        overall_decision=Decision(inspection.overall_decision),
        coverage=inspection.coverage or {},
    )


def get_report(db: Session, inspection_id: str) -> InspectionReportOut | None:
    """Return the stored report for a submitted inspection."""
    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None or inspection.status != "submitted":
        return None
    return _inspection_to_report(inspection)


def submit_via_ocr(
    db: Session,
    inspection_id: str,
    image_paths: list[str],
    corrections: list["FieldCorrection"] | None = None,
) -> InspectionReportOut | None:
    """
    Phase 2 submission path: run OCR pipeline → FieldEvidence → rule engine.

    Uses EasyOCREngine as primary and TesseractEngine as secondary
    (genuinely independent architectures — see ARCHITECTURE.md Known Decisions).
    If Tesseract is unavailable, secondary=None is passed to the pipeline
    and all critical fields get NOT_VERIFIABLE + single_engine_only=True.

    CONTRACTS.md §2: primary + secondary engines required for critical fields.
    """
    from app.ocr.engines.easyocr_engine import EasyOCREngine  # noqa: PLC0415
    from app.ocr.pipeline import run_pipeline  # noqa: PLC0415

    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None:
        return None

    primary = EasyOCREngine()

    # Attempt to instantiate Tesseract as secondary engine.
    # If unavailable, secondary=None is the honest fallback — the pipeline
    # returns NOT_VERIFIABLE for critical fields and we set single_engine_only=True.
    secondary = None
    tesseract_available = False
    try:
        from app.ocr.engines.tesseract_engine import TesseractEngine  # noqa: PLC0415
        secondary = TesseractEngine()
        tesseract_available = True
    except (RuntimeError, ImportError) as exc:
        # Tesseract binary not installed or pytesseract missing.
        # Log clearly so it surfaces in dev, not silently.
        import logging
        logging.getLogger(__name__).warning(
            "Tesseract secondary engine unavailable: %s. "
            "All critical fields will be single_engine_only=True (REVIEW ceiling). "
            "Install: winget install UB-Mannheim.TesseractOCR -e",
            exc,
        )

    field_evidences, full_ocr_text = run_pipeline(
        image_paths=image_paths,
        primary_engine=primary,
        secondary_engine=secondary,   # None → pipeline marks fields NOT_VERIFIABLE
    )

    # Convert FieldEvidence dataclasses → Pydantic FieldEvidenceIn.
    # Carry single_engine_only through so evaluate_field() caps at REVIEW.
    from app.schemas.inspection import FieldEvidenceIn  # noqa: PLC0415

    evidences_in = [
        FieldEvidenceIn(
            field_name=ev.field_name,
            state=ev.state,
            value=ev.value,
            source_image=ev.source_image,
            bbox=ev.bbox,
            ocr_engine=ev.ocr_engine,
            ocr_confidence=ev.ocr_confidence,
            secondary_value=ev.secondary_value,
            image_quality=ev.image_quality,
            candidates=list(ev.candidates or []),
            # Gap 2: flag is True when Tesseract was unavailable
            single_engine_only=not tesseract_available,
        )
        for ev in field_evidences
    ]

    coverage = _build_coverage_from_images(db, inspection_id)

    return submit_inspection(
        db,
        inspection_id=inspection_id,
        field_evidences_in=evidences_in,
        coverage=coverage,
        corrections=corrections,
    )


def analyze_via_ocr(
    db: Session,
    inspection_id: str,
    image_paths: list[str],
) -> "AnalyzeResponse" | None:
    """
    Phase 3.5: Run the OCR pipeline and rule engine, returning a draft AnalyzeResponse.
    Does NOT persist a final InspectionReport to the DB.
    """
    from app.ocr.engines.easyocr_engine import EasyOCREngine  # noqa: PLC0415
    from app.ocr.pipeline import run_pipeline  # noqa: PLC0415
    from app.services.category_checker import check_category_mismatch  # noqa: PLC0415
    from app.schemas.inspection import AnalyzeResponse, RuleResultOut  # noqa: PLC0415

    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None:
        return None

    primary = EasyOCREngine()

    secondary = None
    tesseract_available = False
    try:
        from app.ocr.engines.tesseract_engine import TesseractEngine  # noqa: PLC0415
        secondary = TesseractEngine()
        tesseract_available = True
    except (RuntimeError, ImportError):
        pass

    field_evidences, full_ocr_text = run_pipeline(
        image_paths=image_paths,
        primary_engine=primary,
        secondary_engine=secondary,
    )

    coverage = _build_coverage_from_images(db, inspection_id)
    category = inspection.category or ""
    active_version = CURRENT_RULE_VERSION
    category_rules = get_rules(category, rule_version=active_version)

    rule_results_out = []
    if not category_rules.supported:
        # Category unsupported, all fields fail or category isn't supported.
        row = _make_category_not_supported_result(category, active_version)
        evidence_out = _evidence_from_json(row.evidence_json)
        rule_results_out.append(
            RuleResultOut(
                rule_id=row.rule_id,
                rule_version=row.rule_version,
                field_name=row.field_name,
                decision=Decision(row.decision),
                reason=row.reason,
                evidence=evidence_out,
            )
        )
    else:
        field_rule_lookup = {fr.field: fr for fr in category_rules.fields}
        for ev_dc in field_evidences:
            # D8 fix: if tesseract was unavailable, cap at REVIEW
            if not tesseract_available:
                ev_dc.single_engine_only = True
                
            fr = field_rule_lookup.get(ev_dc.field_name)
            rule_id = fr.rule_id if fr else f"LM-UNKNOWN-{ev_dc.field_name}"
            required = fr.required if fr else False
            rr = evaluate_field(
                ev_dc, rule_id, active_version,
                required=required,
                coverage=coverage,
            )
            evidence_out = _evidence_from_json(_evidence_to_json(ev_dc))
            rule_results_out.append(
                RuleResultOut(
                    rule_id=rr.rule_id,
                    rule_version=rr.rule_version,
                    field_name=rr.field_name,
                    decision=rr.decision,
                    reason=rr.reason,
                    evidence=evidence_out,
                )
            )
            
    is_mismatch, mismatch_warning = check_category_mismatch(full_ocr_text, category)

    return AnalyzeResponse(
        inspection_id=inspection_id,
        category=category,
        rule_version=active_version,
        field_results=rule_results_out,
        category_mismatch=is_mismatch,
        category_mismatch_warning=mismatch_warning,
    )


def _build_coverage_from_images(db: Session, inspection_id: str) -> dict:
    """Derive coverage dict from uploaded image roles."""
    from app.models import InspectionImage  # noqa: PLC0415

    rows = (
        db.query(InspectionImage)
        .filter(InspectionImage.inspection_id == inspection_id)
        .all()
    )
    roles_present = {r.role for r in rows if r.accepted}
    return {
        "front": "front" in roles_present,
        "back": "back" in roles_present,
        "close_up": "close_up" in roles_present,
    }


# ---------------------------------------------------------------------------
# Phase 5 — Review / override (supervisor only, Phase 6 adds auth gate)
# ---------------------------------------------------------------------------


def create_review(
    db: Session,
    inspection_id: str,
    reviewer_id: str,
    overridden_decision: str,
    reason: str,
) -> "ReviewRecordOut | None":
    """
    Create a supervisor override record.

    CONTRACTS.md #7 / AGENTS.md rule 5:
      - NEVER modifies the original Inspection row.
      - Creates a new ReviewRecord referencing the inspection_id.
      - Returns None if the inspection doesn't exist or is not yet submitted.
    """
    from app.models import ReviewRecord  # noqa: PLC0415
    from app.schemas.inspection import ReviewRecordOut  # noqa: PLC0415

    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None or inspection.status != "submitted":
        return None

    record = ReviewRecord(
        inspection_id=inspection_id,
        reviewer_id=reviewer_id,
        overridden_decision=overridden_decision,
        reason=reason,
        original_decision=inspection.overall_decision or "",
    )
    db.add(record)
    db.commit()
    db.refresh(record)

    return ReviewRecordOut(
        id=record.id,
        inspection_id=record.inspection_id,
        reviewer_id=record.reviewer_id,
        overridden_decision=Decision(record.overridden_decision),
        reason=record.reason,
        original_decision=Decision(record.original_decision),
        created_at=record.created_at.isoformat(),
    )


def get_audit_trail(
    db: Session,
    inspection_id: str,
) -> "AuditTrailOut | None":
    """
    Return the full audit trail: original report + all ReviewRecords in order.

    CONTRACTS.md #7: The original report is never mutated — the audit trail
    is the original plus all reviews appended on top.
    """
    from app.schemas.inspection import AuditTrailOut, ReviewRecordOut  # noqa: PLC0415

    inspection = db.query(Inspection).filter(Inspection.id == inspection_id).first()
    if inspection is None or inspection.status != "submitted":
        return None

    report = _inspection_to_report(inspection)

    reviews_out = []
    for rev in inspection.reviews:
        reviews_out.append(
            ReviewRecordOut(
                id=rev.id,
                inspection_id=rev.inspection_id,
                reviewer_id=rev.reviewer_id,
                overridden_decision=Decision(rev.overridden_decision),
                reason=rev.reason,
                original_decision=Decision(rev.original_decision),
                created_at=rev.created_at.isoformat(),
            )
        )

    return AuditTrailOut(inspection=report, reviews=reviews_out)


def list_inspections(
    db: Session,
    *,
    status: str | None = None,
    category: str | None = None,
    overall_decision: str | None = None,
    inspector_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> "InspectionListOut":
    """
    Paginated inspection list for the dashboard.
    Supports filtering by status, category, decision, inspector, and date range.
    """
    from datetime import datetime  # noqa: PLC0415

    from app.models import ReviewRecord  # noqa: PLC0415
    from app.schemas.inspection import (  # noqa: PLC0415
        InspectionListItem,
        InspectionListOut,
    )

    q = db.query(Inspection)
    if status:
        q = q.filter(Inspection.status == status)
    if category:
        q = q.filter(Inspection.category == category)
    if overall_decision:
        q = q.filter(Inspection.overall_decision == overall_decision)
    if inspector_id:
        q = q.filter(Inspection.inspector_id == inspector_id)
    if date_from:
        q = q.filter(Inspection.created_at >= datetime.fromisoformat(date_from))
    if date_to:
        q = q.filter(Inspection.created_at <= datetime.fromisoformat(date_to))

    total = q.count()
    rows = q.order_by(Inspection.created_at.desc()).offset(offset).limit(limit).all()

    # Batch-check which inspections have reviews
    inspection_ids = [r.id for r in rows]
    reviewed_ids: set[str] = set()
    if inspection_ids:
        rev_rows = (
            db.query(ReviewRecord.inspection_id)
            .filter(ReviewRecord.inspection_id.in_(inspection_ids))
            .distinct()
            .all()
        )
        reviewed_ids = {r[0] for r in rev_rows}

    items = [
        InspectionListItem(
            inspection_id=row.id,
            inspector_id=row.inspector_id,
            category=row.category,
            overall_decision=Decision(row.overall_decision) if row.overall_decision else None,
            rule_version=row.rule_version,
            status=row.status,
            created_at=row.created_at.isoformat(),
            has_reviews=row.id in reviewed_ids,
        )
        for row in rows
    ]
    return InspectionListOut(items=items, total=total)


def get_inspection_images(db: Session, inspection_id: str) -> list:
    """Return image metadata list including web-accessible URLs for bounding box viewer."""
    from pathlib import Path  # noqa: PLC0415
    from app.models import InspectionImage  # noqa: PLC0415
    from app.schemas.inspection import InspectionImageMetaOut  # noqa: PLC0415

    rows = (
        db.query(InspectionImage)
        .filter(InspectionImage.inspection_id == inspection_id)
        .order_by(InspectionImage.created_at)
        .all()
    )

    results = []
    for r in rows:
        filename = Path(r.file_path).name
        url = f"/static/images/{inspection_id}/{filename}"
        results.append(
            InspectionImageMetaOut(
                id=r.id,
                inspection_id=r.inspection_id,
                role=r.role,
                quality=r.quality,
                accepted=r.accepted,
                url=url,
                original_width=r.original_width,
                original_height=r.original_height,
            )
        )
    return results


def get_decision_quality_analytics(db: Session) -> "DecisionQualityAnalyticsOut":
    """
    Phase 9 (Gap 4): Decision Quality Tracking.
    Calculates review rate, supervisor override rate, decision breakdown, and top review fields.
    """
    from collections import Counter  # noqa: PLC0415
    from app.models import FieldResult, InspectionImage, ReviewRecord  # noqa: PLC0415
    from app.schemas.inspection import (  # noqa: PLC0415
        DecisionQualityAnalyticsOut,
        DecisionQualityFieldTrigger,
    )

    inspections = db.query(Inspection).filter(Inspection.status == "submitted").all()
    total_inspections = len(inspections)

    decision_counts = Counter()
    review_inspection_ids = set()

    for insp in inspections:
        dec = insp.overall_decision or "UNKNOWN"
        decision_counts[dec] += 1
        if dec == Decision.REVIEW.value or dec == "REVIEW":
            review_inspection_ids.add(insp.id)

    review_count = len(review_inspection_ids)
    review_rate_percentage = round((review_count / total_inspections * 100), 2) if total_inspections > 0 else 0.0

    # Overrides
    all_overrides = db.query(ReviewRecord).all()
    overridden_inspection_ids = {r.inspection_id for r in all_overrides}

    # Count how many REVIEW inspections were overridden
    overridden_reviews_count = len(review_inspection_ids.intersection(overridden_inspection_ids))
    confirmed_reviews_count = max(0, review_count - overridden_reviews_count)
    override_rate_percentage = round((overridden_reviews_count / review_count * 100), 2) if review_count > 0 else 0.0

    # Top review trigger fields: count fields in review inspections where decision == REVIEW
    field_results = (
        db.query(FieldResult)
        .join(Inspection, FieldResult.inspection_id == Inspection.id)
        .filter(Inspection.overall_decision == Decision.REVIEW.value)
        .filter(FieldResult.decision == Decision.REVIEW.value)
        .all()
    )

    field_counter = Counter([fr.field_name for fr in field_results])
    total_field_reviews = sum(field_counter.values())

    top_trigger_fields = []
    for field_name, count in field_counter.most_common(5):
        pct = round((count / total_field_reviews * 100), 2) if total_field_reviews > 0 else 0.0
        top_trigger_fields.append(
            DecisionQualityFieldTrigger(
                field_name=field_name,
                review_count=count,
                percentage=pct,
            )
        )

    # Default entries if empty
    if not top_trigger_fields:
        top_trigger_fields = [
            DecisionQualityFieldTrigger(field_name="mrp", review_count=0, percentage=0.0),
            DecisionQualityFieldTrigger(field_name="consumer_care", review_count=0, percentage=0.0),
            DecisionQualityFieldTrigger(field_name="mfg_date", review_count=0, percentage=0.0),
        ]

    return DecisionQualityAnalyticsOut(
        total_inspections=total_inspections,
        review_count=review_count,
        review_rate_percentage=review_rate_percentage,
        overridden_reviews_count=overridden_reviews_count,
        confirmed_reviews_count=confirmed_reviews_count,
        override_rate_percentage=override_rate_percentage,
        decision_counts=dict(decision_counts),
        top_review_trigger_fields=top_trigger_fields,
    )

