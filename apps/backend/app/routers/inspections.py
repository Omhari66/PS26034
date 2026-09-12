"""
FastAPI router for inspection endpoints.

All endpoints are under /api/v1 (prefix set in main.py).
Auth is not implemented in Phase 1-5 — see Phase 6.

Phase 2 additions:
  POST   /inspections/{id}/images     → upload + quality-gate image
  POST   /inspections/{id}/submit     → now runs OCR pipeline

Phase 5 additions:
  GET    /inspections                  → list with filters (dashboard)
  POST   /inspections/{id}/review      → supervisor override (append-only)
  GET    /inspections/{id}/audit       → full audit trail
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth import get_current_user, require_supervisor
from app.schemas.inspection import (
    AuditTrailOut,
    CreateInspectionRequest,
    CreateInspectionResponse,
    ImageUploadResponse,
    InspectionListOut,
    InspectionReportOut,
    ReviewRecordOut,
    ReviewRequest,
    SetCategoryRequest,
    SetCategoryResponse,
    SubmitInspectionRequest,
    AnalyzeResponse,
    DecisionQualityAnalyticsOut,
    InspectionImageMetaOut,
)
from app.services import image_service as img_svc
from app.services import inspection_service as svc
from app.services.auth_service import UserRecord

# All inspection endpoints require a valid JWT (Phase 6).
# The /review endpoint additionally requires the supervisor role.
router = APIRouter(
    prefix="/inspections",
    tags=["inspections"],
    dependencies=[Depends(get_current_user)],
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _not_found(inspection_id: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={
            "code": "INSPECTION_NOT_FOUND",
            "message": f"No inspection with id {inspection_id}",
        },
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "",
    response_model=CreateInspectionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new inspection",
)
def create_inspection(
    body: CreateInspectionRequest,
    db: Session = Depends(get_db),
) -> CreateInspectionResponse:
    inspection = svc.create_inspection(db, inspector_id=body.inspector_id)
    return CreateInspectionResponse(
        inspection_id=inspection.id,
        status=inspection.status,
    )


@router.post(
    "/{inspection_id}/category",
    response_model=SetCategoryResponse,
    summary="Set the inspector-confirmed product category",
)
def set_category(
    inspection_id: str,
    body: SetCategoryRequest,
    db: Session = Depends(get_db),
) -> SetCategoryResponse:
    inspection = svc.set_category(db, inspection_id=inspection_id, category=body.category)
    if inspection is None:
        raise _not_found(inspection_id)
    return SetCategoryResponse(inspection_id=inspection.id, category=inspection.category)


@router.post(
    "/{inspection_id}/images",
    response_model=ImageUploadResponse,
    summary=(
        "Upload a product label image. "
        "Quality-gated: low-quality images are rejected (accepted=false) "
        "and will not be used in OCR."
    ),
)
def upload_image(
    inspection_id: str,
    role: str = Form(..., description="front | back | close_up"),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> ImageUploadResponse:
    inspection = svc.get_inspection(db, inspection_id)
    if inspection is None:
        raise _not_found(inspection_id)
    if inspection.status == "submitted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "ALREADY_SUBMITTED",
                "message": "Cannot add images to a submitted inspection.",
            },
        )
    if role not in img_svc.VALID_ROLES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "INVALID_ROLE",
                "message": f"role must be one of {sorted(img_svc.VALID_ROLES)}",
            },
        )

    file_bytes = file.file.read()
    img_row = img_svc.store_image(
        db,
        inspection_id=inspection_id,
        role=role,
        file_bytes=file_bytes,
        original_filename=file.filename or "upload.jpg",
    )
    return ImageUploadResponse(
        image_id=img_row.id,
        role=img_row.role,
        quality=img_row.quality,
        accepted=img_row.accepted,
        reason=img_row.quality_reason or "",
    )


@router.post(
    "/{inspection_id}/analyze",
    response_model=AnalyzeResponse,
    summary=(
        "Phase 3.5: Run the rule engine and return draft analysis. "
        "Does NOT persist the report. Used to display reconciliation UX."
    ),
)
def analyze_inspection(
    inspection_id: str,
    db: Session = Depends(get_db),
) -> AnalyzeResponse:
    inspection = svc.get_inspection(db, inspection_id)
    if inspection is None:
        raise _not_found(inspection_id)
    if inspection.status == "submitted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "ALREADY_SUBMITTED",
                "message": "This inspection has already been submitted.",
            },
        )
    if inspection.category is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "CATEGORY_REQUIRED",
                "message": "Set the category before analyzing.",
            },
        )

    accepted_paths = img_svc.get_accepted_image_paths(db, inspection_id)
    if not accepted_paths:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "NO_IMAGES",
                "message": "Upload at least one image via POST /images before analyzing.",
            },
        )

    resp = svc.analyze_via_ocr(db, inspection_id, accepted_paths)
    if resp is None:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return resp


@router.post(
    "/{inspection_id}/submit",
    response_model=InspectionReportOut,
    summary=(
        "Run the rule engine and generate an inspection report. "
        "Phase 2: uses uploaded images → OCR pipeline. "
        "Phase 3.5: accepts corrections for REVIEW fields."
    ),
)
def submit_inspection(
    inspection_id: str,
    body: SubmitInspectionRequest | None = None,
    db: Session = Depends(get_db),
) -> InspectionReportOut:
    inspection = svc.get_inspection(db, inspection_id)
    if inspection is None:
        raise _not_found(inspection_id)
    if inspection.status == "submitted":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "code": "ALREADY_SUBMITTED",
                "message": "This inspection has already been submitted.",
            },
        )
    if inspection.category is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "CATEGORY_REQUIRED",
                "message": "Set the category before submitting.",
            },
        )

    # --- Phase 2: check for uploaded images first ---
    accepted_paths = img_svc.get_accepted_image_paths(db, inspection_id)

    if accepted_paths:
        # Real OCR path (Phase 2)
        report = svc.submit_via_ocr(
            db,
            inspection_id=inspection_id,
            image_paths=accepted_paths,
            corrections=body.corrections if body else None,
        )
    elif body is not None and body.field_evidences:
        # Phase 1 fallback: hand-crafted evidence
        # TODO(phase2-cleanup): remove this branch once OCR pipeline is validated
        report = svc.submit_inspection(
            db,
            inspection_id=inspection_id,
            field_evidences_in=body.field_evidences,
            coverage=body.coverage if body else {},
            corrections=body.corrections,
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail={
                "code": "NO_EVIDENCE",
                "message": (
                    "No accepted images uploaded and no field_evidences provided. "
                    "Upload at least one image via POST /images before submitting."
                ),
            },
        )

    if report is None:  # pragma: no cover
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return report


@router.get(
    "/{inspection_id}",
    response_model=InspectionReportOut,
    summary="Retrieve a stored inspection report",
)
def get_inspection(
    inspection_id: str,
    db: Session = Depends(get_db),
) -> InspectionReportOut:
    report = svc.get_report(db, inspection_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "REPORT_NOT_FOUND",
                "message": f"No submitted report for inspection {inspection_id}",
            },
        )
    return report


# ---------------------------------------------------------------------------
# Phase 5 — Dashboard list, review/override, audit trail
# ---------------------------------------------------------------------------


@router.get(
    "",
    response_model=InspectionListOut,
    summary="List inspections with optional filters (dashboard)",
)
def list_inspections(
    status: str | None = None,
    category: str | None = None,
    decision: str | None = None,
    inspector_id: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> InspectionListOut:
    """Returns paginated inspections. Filter by ?status=REVIEW for the REVIEW queue."""
    return svc.list_inspections(
        db,
        status=status,
        category=category,
        overall_decision=decision,
        inspector_id=inspector_id,
        date_from=date_from,
        date_to=date_to,
        limit=min(limit, 200),
        offset=offset,
    )


@router.post(
    "/{inspection_id}/review",
    response_model=ReviewRecordOut,
    status_code=status.HTTP_201_CREATED,
    summary="Supervisor override — creates a ReviewRecord (never edits original)",
)
def create_review(
    inspection_id: str,
    body: ReviewRequest,
    db: Session = Depends(get_db),
    _supervisor: UserRecord = Depends(require_supervisor),
) -> ReviewRecordOut:
    """
    Creates a linked ReviewRecord. The original InspectionReport is never
    modified. CONTRACTS.md #7: append-only.
    """
    result = svc.create_review(
        db,
        inspection_id=inspection_id,
        reviewer_id=body.reviewer_id,
        overridden_decision=body.overridden_decision.value,
        reason=body.reason,
    )
    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "REPORT_NOT_FOUND",
                "message": (
                    f"Inspection {inspection_id} not found or not yet submitted. "
                    "Only submitted inspections can be reviewed."
                ),
            },
        )
    return result


@router.get(
    "/analytics/decision-quality",
    response_model=DecisionQualityAnalyticsOut,
    summary="Phase 9 (Gap 4): Decision quality tracking metrics",
)
def get_decision_quality_analytics(
    db: Session = Depends(get_db),
) -> DecisionQualityAnalyticsOut:
    """Returns review rate %, supervisor override %, decision breakdown, and top review fields."""
    return svc.get_decision_quality_analytics(db)


@router.get(
    "/{inspection_id}/audit",
    response_model=AuditTrailOut,
    summary="Full audit trail: original report + all review records",
)
def get_audit_trail(
    inspection_id: str,
    db: Session = Depends(get_db),
) -> AuditTrailOut:
    trail = svc.get_audit_trail(db, inspection_id)
    if trail is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "REPORT_NOT_FOUND",
                "message": f"No submitted inspection with id {inspection_id}",
            },
        )
    return trail


@router.get(
    "/{inspection_id}/images",
    response_model=list[InspectionImageMetaOut],
    summary="List image metadata with web URLs for bounding box viewer",
)
def get_inspection_images(
    inspection_id: str,
    db: Session = Depends(get_db),
) -> list[InspectionImageMetaOut]:
    return svc.get_inspection_images(db, inspection_id)


