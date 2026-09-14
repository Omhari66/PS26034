"""
End-to-end API integration tests for the inspection endpoints.

Tests the full HTTP flow:
  POST /api/v1/inspections
  POST /api/v1/inspections/{id}/category
  POST /api/v1/inspections/{id}/submit
  GET  /api/v1/inspections/{id}

DB: SQLite in-memory via conftest.py — no Postgres needed.
"""

# ---------------------------------------------------------------------------
# Fixture helpers
# ---------------------------------------------------------------------------

# Hand-crafted FieldEvidence payloads for each test scenario.
# These are the "hand-crafted fixtures" Phase 1 is defined around.

_ALL_PASS_EVIDENCES = [
    {
        "field_name": "mrp",
        "state": "FOUND",
        "value": "149.00",
        "secondary_value": "149.00",
        "source_image": "front.jpg",
        "bbox": [10, 20, 200, 80],
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.94,
    },
    {
        "field_name": "net_quantity",
        "state": "FOUND",
        "value": "500g",
        "secondary_value": "500g",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.91,
    },
    {
        "field_name": "manufacturing_date",
        "state": "FOUND",
        "value": "2025-01-01",
        "secondary_value": "2025-01-01",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.87,
    },
    {
        "field_name": "manufacturer_name",
        "state": "FOUND",
        "value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "secondary_value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.88,
    },
    {
        "field_name": "consumer_care",
        "state": "FOUND",
        "value": "1800-000-000",
        "secondary_value": "1800-000-000",
        "ocr_engine": "paddleocr",
        "ocr_confidence": 0.85,
    },
]

_MIXED_EVIDENCES = [
    # mrp: PASS
    {
        "field_name": "mrp",
        "state": "FOUND",
        "value": "149.00",
        "secondary_value": "149.00",
        "ocr_confidence": 0.94,
    },
    # net_quantity: PASS
    {
        "field_name": "net_quantity",
        "state": "FOUND",
        "value": "500g",
        "secondary_value": "500g",
        "ocr_confidence": 0.91,
    },
    # manufacturing_date: REVIEW (NOT_VERIFIABLE)
    {"field_name": "manufacturing_date", "state": "NOT_VERIFIABLE", "image_quality": "low"},
    # manufacturer_name: PASS
    {
        "field_name": "manufacturer_name",
        "state": "FOUND",
        "value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "secondary_value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "ocr_confidence": 0.88,
    },  # noqa: E501
    # consumer_care: FAIL (NOT_FOUND, required)
    {"field_name": "consumer_care", "state": "NOT_FOUND"},
]

_REVIEW_ONLY_EVIDENCES = [
    {
        "field_name": "mrp",
        "state": "FOUND",
        "value": "149.00",
        "secondary_value": "149.00",
        "ocr_confidence": 0.94,
    },
    {
        "field_name": "net_quantity",
        "state": "FOUND",
        "value": "500g",
        "secondary_value": "500g",
        "ocr_confidence": 0.91,
    },
    {"field_name": "manufacturing_date", "state": "NOT_VERIFIABLE", "image_quality": "low"},
    {
        "field_name": "manufacturer_name",
        "state": "FOUND",
        "value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "secondary_value": '[{"role": "manufactured by", "name": "Acme Corp"}]',
        "ocr_confidence": 0.88,
    },  # noqa: E501
    {
        "field_name": "consumer_care",
        "state": "FOUND",
        "value": "1800-000-000",
        "secondary_value": "1800-000-000",
        "ocr_confidence": 0.85,
    },  # noqa: E501
]

_COVERAGE = {"front": True, "back": True, "close_up": False}


def _create_and_submit(
    client, category: str, evidences: list, coverage: dict = _COVERAGE, corrections: list = None
):
    """Helper: full 3-step flow → returns the report response dict."""
    # 1. Create
    r = client.post("/api/v1/inspections", json={"inspector_id": "inspector_001"})
    assert r.status_code == 201, r.text
    insp_id = r.json()["inspection_id"]

    # 2. Category
    r = client.post(f"/api/v1/inspections/{insp_id}/category", json={"category": category})
    assert r.status_code == 200, r.text

    # 3. Submit
    payload = {"coverage": coverage, "field_evidences": evidences}
    if corrections is not None:
        payload["corrections"] = corrections
    r = client.post(f"/api/v1/inspections/{insp_id}/submit", json=payload)
    assert r.status_code == 200, r.text
    return insp_id, r.json()


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


class TestCreateInspection:
    def test_returns_201_with_inspection_id(self, client):
        r = client.post("/api/v1/inspections", json={"inspector_id": "inspector_001"})
        assert r.status_code == 201
        body = r.json()
        assert "inspection_id" in body
        assert body["status"] == "capturing"

    def test_inspection_id_is_uuid_string(self, client):
        import uuid

        r = client.post("/api/v1/inspections", json={"inspector_id": "inspector_001"})
        insp_id = r.json()["inspection_id"]
        uuid.UUID(insp_id)  # raises if not a valid UUID


class TestSetCategory:
    def test_sets_category_successfully(self, client):
        r = client.post("/api/v1/inspections", json={"inspector_id": "i1"})
        insp_id = r.json()["inspection_id"]

        r = client.post(  # noqa: E501
            f"/api/v1/inspections/{insp_id}/category", json={"category": "packaged_food"}
        )
        assert r.status_code == 200
        assert r.json()["category"] == "packaged_food"

    def test_unknown_inspection_id_returns_404(self, client):
        r = client.post(  # noqa: E501
            "/api/v1/inspections/nonexistent/category", json={"category": "packaged_food"}
        )
        assert r.status_code == 404


class TestSubmitInspection:
    def test_all_pass_produces_pass(self, client):
        """All 5 fields FOUND + high confidence → PASS."""
        _, report = _create_and_submit(client, "packaged_food", _ALL_PASS_EVIDENCES)
        assert report["overall_decision"] == "PASS"

    def test_mixed_evidences_produces_fail(self, client):
        """consumer_care NOT_FOUND (FAIL) beats mfg_date NOT_VERIFIABLE (REVIEW) → FAIL."""
        corrections = [
            {
                "field_name": "manufacturing_date",
                "action": "confirmed",
                "reviewer_id": "inspector_001",
                "acknowledged": True,
            }
        ]
        _, report = _create_and_submit(
            client, "packaged_food", _MIXED_EVIDENCES, corrections=corrections
        )
        assert report["overall_decision"] == "FAIL"

    def test_one_not_verifiable_no_fail_produces_review(self, client):
        """4 PASS + 1 REVIEW, no FAIL → overall REVIEW. (But since we correct it, it's PASS)"""
        corrections = [
            {
                "field_name": "manufacturing_date",
                "action": "escalated",
                "reviewer_id": "inspector_001",
                "acknowledged": True,
            }
        ]
        _, report = _create_and_submit(
            client, "packaged_food", _REVIEW_ONLY_EVIDENCES, corrections=corrections
        )
        assert report["overall_decision"] == "REVIEW"

    def test_unsupported_category_produces_category_not_supported(self, client):
        """Category not in SUPPORTED_CATEGORIES → CATEGORY_NOT_SUPPORTED."""
        _, report = _create_and_submit(client, "jewellery", _ALL_PASS_EVIDENCES)
        assert report["overall_decision"] == "CATEGORY_NOT_SUPPORTED"

    def test_report_contains_correct_field_count(self, client):
        """One RuleResult per submitted field evidence."""
        _, report = _create_and_submit(client, "packaged_food", _ALL_PASS_EVIDENCES)
        assert len(report["field_results"]) == 5

    def test_report_field_decisions_correct(self, client):
        """Per-field decisions match expected outcomes for the mixed fixture."""
        corrections = [
            {
                "field_name": "manufacturing_date",
                "action": "confirmed",
                "reviewer_id": "inspector_001",
                "acknowledged": True,
            }
        ]
        _, report = _create_and_submit(
            client, "packaged_food", _MIXED_EVIDENCES, corrections=corrections
        )
        decisions = {fr["field_name"]: fr["decision"] for fr in report["field_results"]}
        assert decisions["mrp"] == "PASS"
        assert decisions["net_quantity"] == "PASS"
        assert decisions["manufacturing_date"] == "PASS"  # Corrected!
        assert decisions["manufacturer_name"] == "PASS"
        assert decisions["consumer_care"] == "FAIL"

    def test_report_carries_rule_version(self, client):
        _, report = _create_and_submit(client, "packaged_food", _ALL_PASS_EVIDENCES)
        assert report["rule_version"] == "v1.0"
        for fr in report["field_results"]:
            assert fr["rule_version"] == "v1.0"

    def test_report_carries_coverage(self, client):
        _, report = _create_and_submit(client, "packaged_food", _ALL_PASS_EVIDENCES)
        assert report["coverage"]["front"] is True
        assert report["coverage"]["close_up"] is False

    def test_report_evidence_bbox_preserved(self, client):
        """bbox submitted is preserved in the returned evidence — traceable chain."""
        _, report = _create_and_submit(client, "packaged_food", _ALL_PASS_EVIDENCES)
        mrp_fr = next(fr for fr in report["field_results"] if fr["field_name"] == "mrp")
        print("DEBUG REPORT EVIDENCES:", [fr["evidence"] for fr in report["field_results"]])
        assert mrp_fr["evidence"]["bbox"] == [10, 20, 200, 80]

    def test_submit_without_category_returns_422(self, client):
        """Submitting without setting category first → 422."""
        r = client.post("/api/v1/inspections", json={"inspector_id": "i1"})
        insp_id = r.json()["inspection_id"]
        r = client.post(
            f"/api/v1/inspections/{insp_id}/submit",
            json={"coverage": _COVERAGE, "field_evidences": _ALL_PASS_EVIDENCES},
        )
        assert r.status_code == 422

    def test_double_submit_returns_409(self, client):
        """Submitting the same inspection twice → 409 Conflict."""
        r = client.post("/api/v1/inspections", json={"inspector_id": "i1"})
        insp_id = r.json()["inspection_id"]
        client.post(f"/api/v1/inspections/{insp_id}/category", json={"category": "packaged_food"})
        payload = {"coverage": _COVERAGE, "field_evidences": _ALL_PASS_EVIDENCES}
        r1 = client.post(f"/api/v1/inspections/{insp_id}/submit", json=payload)
        assert r1.status_code == 200
        r2 = client.post(f"/api/v1/inspections/{insp_id}/submit", json=payload)
        assert r2.status_code == 409

    def test_unknown_inspection_returns_404(self, client):
        r = client.post(
            "/api/v1/inspections/nonexistent/submit",
            json={"coverage": _COVERAGE, "field_evidences": _ALL_PASS_EVIDENCES},
        )
        assert r.status_code == 404


class TestGetInspection:
    def test_get_returns_same_report_as_submit(self, client):
        """GET /inspections/{id} must return the exact same report as POST submit."""
        insp_id, submit_report = _create_and_submit(client, "packaged_food", _ALL_PASS_EVIDENCES)
        r = client.get(f"/api/v1/inspections/{insp_id}")
        assert r.status_code == 200
        get_report = r.json()
        assert get_report["overall_decision"] == submit_report["overall_decision"]
        assert get_report["rule_version"] == submit_report["rule_version"]
        assert len(get_report["field_results"]) == len(submit_report["field_results"])

    def test_get_before_submit_returns_404(self, client):
        """A non-submitted (still 'capturing') inspection has no report yet."""
        r = client.post("/api/v1/inspections", json={"inspector_id": "i1"})
        insp_id = r.json()["inspection_id"]
        r = client.get(f"/api/v1/inspections/{insp_id}")
        assert r.status_code == 404

    def test_get_nonexistent_returns_404(self, client):
        r = client.get("/api/v1/inspections/does-not-exist")
        assert r.status_code == 404

    def test_get_mixed_report_has_correct_field_decisions(self, client):
        """GET of a mixed-evidence report shows the same per-field decisions."""
        corrections = [
            {
                "field_name": "manufacturing_date",
                "action": "confirmed",
                "reviewer_id": "inspector_001",
                "acknowledged": True,
            }
        ]
        insp_id, _ = _create_and_submit(
            client, "packaged_food", _MIXED_EVIDENCES, corrections=corrections
        )
        r = client.get(f"/api/v1/inspections/{insp_id}")
        decisions = {fr["field_name"]: fr["decision"] for fr in r.json()["field_results"]}
        assert decisions["consumer_care"] == "FAIL"
        assert decisions["manufacturing_date"] == "PASS"

    def test_error_response_shape(self, client):
        """Error responses follow API_CONTRACT.md: {"error": {"code": ..., "message": ...}}."""
        # The router wraps HTTPException detail as-is; FastAPI returns {"detail": ...}.
        # Our detail IS the {"code": ..., "message": ...} dict.
        r = client.get("/api/v1/inspections/nonexistent")
        assert r.status_code == 404
        detail = r.json()["detail"]
        assert "code" in detail
        assert "message" in detail
