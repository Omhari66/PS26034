"""
Tests for Phase 9 Ticket 13 — Decision Quality Analytics Dashboard.

Verifies GET /analytics/decision-quality endpoint calculations, structured
FieldCorrection handling, supervisor ReviewRecord overrides vs confirmations,
weekly REVIEW rate calculations, and top REVIEW-triggering field aggregation.
"""

from datetime import UTC, datetime, timedelta
import pytest
from app.models import FieldResult, Inspection, ReviewRecord
from app.services import inspection_service as svc


class TestDecisionQualityAnalytics:
    def test_analytics_empty_database(self, db):
        """When DB has no submitted inspections, returns zero counts and clean empty structures."""
        res = svc.get_decision_quality_analytics(db)
        assert res.total_inspections == 0
        assert res.review_count == 0
        assert res.review_rate_percentage == 0.0
        assert res.weekly_total_inspections == 0
        assert res.weekly_review_count == 0
        assert res.weekly_review_rate_percentage == 0.0
        assert res.overridden_reviews_count == 0
        assert res.confirmed_reviews_count == 0
        assert res.override_rate_percentage == 0.0
        assert res.confirmation_rate_percentage == 0.0
        assert res.top_review_trigger_fields == []

    def test_analytics_all_pass_no_review(self, db):
        """When DB has submitted inspections with only PASS decisions."""
        insp1 = Inspection(
            id="insp-pass-1",
            inspector_id="insp_1",
            status="submitted",
            overall_decision="PASS",
            created_at=datetime.now(UTC),
        )
        db.add(insp1)
        db.commit()

        res = svc.get_decision_quality_analytics(db)
        assert res.total_inspections == 1
        assert res.review_count == 0
        assert res.review_rate_percentage == 0.0
        assert res.decision_counts.get("PASS") == 1
        assert res.top_review_trigger_fields == []

    def test_analytics_review_with_structured_corrections(self, db):
        """Tests calculation of review rate, override rate, confirmation rate from FieldCorrection records."""
        now = datetime.now(UTC)

        # Inspection 1: REVIEW decision with field corrected
        insp1 = Inspection(
            id="insp-rev-1",
            inspector_id="insp_1",
            status="submitted",
            overall_decision="REVIEW",
            created_at=now,
        )
        fr1 = FieldResult(
            id="fr-1",
            inspection_id="insp-rev-1",
            rule_id="LM-MRP-001",
            rule_version="1.0",
            field_name="mrp",
            decision="REVIEW",
            reason="Ambiguous OCR",
            evidence_json={},
            correction_json={
                "field_name": "mrp",
                "action": "corrected",
                "ai_value": "28.00",
                "corrected_value": "29.00",
                "reviewer_id": "rev_1",
                "acknowledged": True,
                "timestamp": now.isoformat(),
            },
        )

        # Inspection 2: REVIEW decision with field confirmed
        insp2 = Inspection(
            id="insp-rev-2",
            inspector_id="insp_2",
            status="submitted",
            overall_decision="REVIEW",
            created_at=now,
        )
        fr2 = FieldResult(
            id="fr-2",
            inspection_id="insp-rev-2",
            rule_id="LM-CC-001",
            rule_version="1.0",
            field_name="consumer_care",
            decision="REVIEW",
            reason="OCR confidence low",
            evidence_json={},
            correction_json={
                "field_name": "consumer_care",
                "action": "confirmed",
                "ai_value": "1800-11-22",
                "corrected_value": "1800-11-22",
                "reviewer_id": "rev_2",
                "acknowledged": True,
                "timestamp": now.isoformat(),
            },
        )

        # Inspection 3: PASS decision
        insp3 = Inspection(
            id="insp-pass-3",
            inspector_id="insp_3",
            status="submitted",
            overall_decision="PASS",
            created_at=now,
        )

        db.add_all([insp1, insp2, insp3, fr1, fr2])
        db.commit()

        res = svc.get_decision_quality_analytics(db)
        assert res.total_inspections == 3
        assert res.review_count == 2
        assert res.review_rate_percentage == 66.67
        assert res.overridden_reviews_count == 1
        assert res.confirmed_reviews_count == 1
        assert res.override_rate_percentage == 50.0
        assert res.confirmation_rate_percentage == 50.0

        # Top trigger fields check
        field_names = [f.field_name for f in res.top_review_trigger_fields]
        assert "mrp" in field_names
        assert "consumer_care" in field_names

    def test_analytics_weekly_filtering(self, db):
        """Tests that weekly review metrics accurately filter inspections created in the last 7 days."""
        now = datetime.now(UTC)
        eight_days_ago = now - timedelta(days=8)

        # Old inspection (8 days ago)
        old_insp = Inspection(
            id="old-insp",
            inspector_id="insp_1",
            status="submitted",
            overall_decision="REVIEW",
            created_at=eight_days_ago,
        )

        # Recent inspection (today)
        recent_insp = Inspection(
            id="recent-insp",
            inspector_id="insp_2",
            status="submitted",
            overall_decision="PASS",
            created_at=now,
        )

        db.add_all([old_insp, recent_insp])
        db.commit()

        res = svc.get_decision_quality_analytics(db)
        assert res.total_inspections == 2
        assert res.review_count == 1
        assert res.weekly_total_inspections == 1
        assert res.weekly_review_count == 0
        assert res.weekly_review_rate_percentage == 0.0

    def test_analytics_http_endpoint(self, client):
        """Tests GET /api/v1/analytics/decision-quality and GET /api/v1/inspections/analytics/decision-quality via HTTP request."""
        res1 = client.get("/api/v1/analytics/decision-quality")
        assert res1.status_code == 200
        data1 = res1.json()
        assert "total_inspections" in data1
        assert "review_rate_percentage" in data1
        assert "override_rate_percentage" in data1

        res2 = client.get("/api/v1/inspections/analytics/decision-quality")
        assert res2.status_code == 200
        data2 = res2.json()
        assert data2["total_inspections"] == data1["total_inspections"]

