"""
FastAPI router for analytics endpoints.

All endpoints are under /api/v1 (prefix set in main.py).
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db import get_db
from app.dependencies.auth import get_current_user
from app.schemas.inspection import DecisionQualityAnalyticsOut
from app.services import inspection_service as svc

router = APIRouter(
    prefix="/analytics",
    tags=["analytics"],
    dependencies=[Depends(get_current_user)],
)


@router.get(
    "/decision-quality",
    response_model=DecisionQualityAnalyticsOut,
    summary="Phase 9 (Ticket 13): Decision quality tracking metrics",
)
def get_decision_quality_analytics(
    db: Session = Depends(get_db),
) -> DecisionQualityAnalyticsOut:
    """Returns total inspections, review rates, supervisor override & confirmation rates, decision counts, and top review fields."""
    return svc.get_decision_quality_analytics(db)
