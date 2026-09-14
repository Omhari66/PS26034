"""
Phase 5 backend tests — review/override, audit trail, and list endpoints.

Definition of done (PHASES.md §5):
  "A supervisor can find a REVIEW item, inspect the evidence, override it,
   and see both the original and the override in the audit trail."

This suite:
  1. Tests GET /inspections with filters.
  2. Tests POST /inspections/{id}/review (append-only, never edits original).
  3. Tests GET /inspections/{id}/audit (original + reviews in order).
  4. Proves the original overall_decision is preserved on the Inspection row
     after a review (append-only contract).

Uses the shared `client` fixture from conftest.py (SQLite in-memory DB).
"""

import copy

# ---------------------------------------------------------------------------
# Helpers — build a submitted inspection we can review
# ---------------------------------------------------------------------------

_PASS_EVIDENCE = [
    {
        "field_name": "mrp",
        "state": "FOUND",
        "value": "149.00",
        "ocr_confidence": 0.95,
        "secondary_value": "149.00",
        "source_image": "front.jpg",
    },
    {
        "field_name": "net_quantity",
        "state": "FOUND",
        "value": "500g",
        "ocr_confidence": 0.95,
        "secondary_value": "500g",
        "source_image": "front.jpg",
    },
    {
        "field_name": "manufacturing_date",
        "state": "FOUND",
        "value": "10/2023",
        "ocr_confidence": 0.95,
        "secondary_value": "10/2023",
        "source_image": "front.jpg",
    },
    {
        "field_name": "manufacturer_name",
        "state": "FOUND",
        "value": '[{"role": "manufactured by", "name": "Test Co"}]',
        "ocr_confidence": 0.95,
        "secondary_value": '[{"role": "manufactured by", "name": "Test Co"}]',
        "source_image": "front.jpg",
    },
    {
        "field_name": "consumer_care",
        "state": "FOUND",
        "value": "test@test.com",
        "ocr_confidence": 0.95,
        "secondary_value": "test@test.com",
        "source_image": "front.jpg",
    },
]

_REVIEW_EVIDENCE = copy.deepcopy(_PASS_EVIDENCE)
_REVIEW_EVIDENCE[0] = {
    "field_name": "mrp",
    "state": "CONFLICTING",
    "candidates": ["149.00", "199.00"],
}


def _create_submitted(client, category: str = "packaged_food", evidence=None) -> str:
    """Create + category-set + submit an inspection. Returns inspection_id."""
    r = client.post(
        "/api/v1/inspections",
        json={"inspector_id": "test-inspector"},
    )
    assert r.status_code == 201
    iid = r.json()["inspection_id"]

    r = client.post(f"/api/v1/inspections/{iid}/category", json={"category": category})
    assert r.status_code == 200

    payload = {
        "coverage": {"front": True, "back": True, "close_up": False},
        "field_evidences": evidence or _PASS_EVIDENCE,
    }
    if evidence == _REVIEW_EVIDENCE:
        payload["corrections"] = [
            {
                "field_name": "mrp",
                "action": "escalated",
                "reviewer_id": "test-inspector",
                "acknowledged": True,
            }
        ]

    r = client.post(
        f"/api/v1/inspections/{iid}/submit",
        json=payload,
    )
    if r.status_code != 200:
        print("SUBMIT FAILED:", r.json())
    assert r.status_code == 200
    return iid


# ---------------------------------------------------------------------------
# 1. GET /inspections  — list + filter
# ---------------------------------------------------------------------------


class TestListInspections:
    def test_returns_list(self, client):
        _create_submitted(client)
        res = client.get("/api/v1/inspections")
        assert res.status_code == 200
        body = res.json()
        assert "items" in body
        assert "total" in body
        assert body["total"] >= 1

    def test_filter_by_decision_pass(self, client):
        _create_submitted(client)
        res = client.get("/api/v1/inspections?decision=PASS")
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert item["overall_decision"] == "PASS"

    def test_filter_by_decision_review(self, client):
        _create_submitted(client, evidence=_REVIEW_EVIDENCE)
        res = client.get("/api/v1/inspections?decision=REVIEW")
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert item["overall_decision"] == "REVIEW"

    def test_filter_by_category(self, client):
        _create_submitted(client, category="cosmetics")
        res = client.get("/api/v1/inspections?category=cosmetics")
        assert res.status_code == 200
        for item in res.json()["items"]:
            assert item["category"] == "cosmetics"

    def test_list_items_have_required_fields(self, client):
        _create_submitted(client)
        res = client.get("/api/v1/inspections")
        item = res.json()["items"][0]
        for key in ("inspection_id", "inspector_id", "status", "created_at", "has_reviews"):
            assert key in item, f"missing key: {key}"

    def test_limit_is_respected(self, client):
        for _ in range(3):
            _create_submitted(client)
        res = client.get("/api/v1/inspections?limit=2")
        assert res.status_code == 200
        assert len(res.json()["items"]) <= 2


# ---------------------------------------------------------------------------
# 2. POST /inspections/{id}/review  — append-only supervisor override
# ---------------------------------------------------------------------------


class TestCreateReview:
    def test_review_created_returns_201(self, client):
        iid = _create_submitted(client)
        res = client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "PASS",
                "reason": "On-site physical verification confirms compliance.",
                "reviewer_id": "supervisor-1",
            },
        )
        assert res.status_code == 201

    def test_review_response_has_required_fields(self, client):
        iid = _create_submitted(client)
        res = client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "FAIL",
                "reason": "Physical check shows MRP sticker missing entirely.",
                "reviewer_id": "supervisor-2",
            },
        )
        body = res.json()
        for key in (
            "id",
            "inspection_id",
            "reviewer_id",
            "overridden_decision",
            "reason",
            "original_decision",
            "created_at",
        ):
            assert key in body, f"missing key: {key}"

    def test_original_decision_preserved_after_review(self, client):
        """AGENTS.md rule 5: the original Inspection row must NOT be changed."""
        iid = _create_submitted(client)  # PASS
        original_report = client.get(f"/api/v1/inspections/{iid}").json()
        assert original_report["overall_decision"] == "PASS"

        # Override to FAIL
        client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "FAIL",
                "reason": "Physical check overrides automated result.",
                "reviewer_id": "sup-1",
            },
        )

        # The original report is unchanged
        reloaded = client.get(f"/api/v1/inspections/{iid}").json()
        assert reloaded["overall_decision"] == "PASS", (
            "Original decision must not change after a review (append-only)."
        )

    def test_review_captures_original_decision(self, client):
        """The review record itself stores what the original decision was."""
        iid = _create_submitted(client)
        orig = client.get(f"/api/v1/inspections/{iid}").json()["overall_decision"]

        res = client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "REVIEW",
                "reason": "Borderline case, escalating to committee.",
                "reviewer_id": "sup-3",
            },
        )
        body = res.json()
        assert body["original_decision"] == orig

    def test_review_on_nonexistent_inspection_returns_404(self, client):
        res = client.post(
            "/api/v1/inspections/nonexistent-id/review",
            json={
                "overridden_decision": "PASS",
                "reason": "This should fail gracefully.",
                "reviewer_id": "sup-x",
            },
        )
        assert res.status_code == 404

    def test_short_reason_rejected(self, client):
        """Reason must be ≥10 characters (schema validation)."""
        iid = _create_submitted(client)
        res = client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "PASS",
                "reason": "short",
                "reviewer_id": "sup-1",
            },
        )
        assert res.status_code == 422

    def test_multiple_reviews_all_appended(self, client):
        """Multiple reviews can exist for the same inspection."""
        iid = _create_submitted(client)
        for i in range(3):
            res = client.post(
                f"/api/v1/inspections/{iid}/review",
                json={
                    "overridden_decision": "REVIEW",
                    "reason": f"Escalation round {i + 1} — further inspection required.",
                    "reviewer_id": f"supervisor-{i}",
                },
            )
            assert res.status_code == 201


# ---------------------------------------------------------------------------
# 3. GET /inspections/{id}/audit  — full audit trail
# ---------------------------------------------------------------------------


class TestAuditTrail:
    def test_audit_trail_no_reviews(self, client):
        iid = _create_submitted(client)
        res = client.get(f"/api/v1/inspections/{iid}/audit")
        assert res.status_code == 200
        body = res.json()
        assert "inspection" in body
        assert body["reviews"] == []

    def test_audit_trail_includes_original_and_reviews(self, client):
        iid = _create_submitted(client)
        client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "FAIL",
                "reason": "Physical check on site shows label damage.",
                "reviewer_id": "sup-audit",
            },
        )
        res = client.get(f"/api/v1/inspections/{iid}/audit")
        assert res.status_code == 200
        body = res.json()
        assert len(body["reviews"]) == 1
        assert body["reviews"][0]["reviewer_id"] == "sup-audit"
        assert body["reviews"][0]["overridden_decision"] == "FAIL"

    def test_audit_trail_reviews_in_chronological_order(self, client):
        """Reviews must appear in the order they were created (append-only)."""
        iid = _create_submitted(client)
        decisions = ["FAIL", "PASS", "REVIEW"]
        for d in decisions:
            client.post(
                f"/api/v1/inspections/{iid}/review",
                json={
                    "overridden_decision": d,
                    "reason": f"Round decision is {d} — verified on site today.",
                    "reviewer_id": "sup-order",
                },
            )

        body = client.get(f"/api/v1/inspections/{iid}/audit").json()
        returned = [r["overridden_decision"] for r in body["reviews"]]
        assert returned == decisions, "Reviews must be in insertion order"

    def test_audit_trail_original_unchanged_by_reviews(self, client):
        """DoD: supervisor can see BOTH the original AND the override."""
        iid = _create_submitted(client)
        orig_decision = client.get(f"/api/v1/inspections/{iid}").json()["overall_decision"]

        client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "FAIL",
                "reason": "Supervisor override: barcode obscured on physical check.",
                "reviewer_id": "sup-dod",
            },
        )

        trail = client.get(f"/api/v1/inspections/{iid}/audit").json()
        # Original report is intact
        assert trail["inspection"]["overall_decision"] == orig_decision
        # Override is visible in the same response
        assert trail["reviews"][0]["overridden_decision"] == "FAIL"
        assert trail["reviews"][0]["original_decision"] == orig_decision

    def test_audit_trail_not_found_returns_404(self, client):
        res = client.get("/api/v1/inspections/nonexistent/audit")
        assert res.status_code == 404

    def test_has_reviews_flag_set_after_review(self, client):
        """InspectionListItem.has_reviews must be True after a review is added."""
        iid = _create_submitted(client)

        # Before review
        before = client.get("/api/v1/inspections").json()
        this = next((i for i in before["items"] if i["inspection_id"] == iid), None)
        assert this is not None
        assert this["has_reviews"] is False

        # Create review
        client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "PASS",
                "reason": "Physical verification confirms compliance with regulations.",
                "reviewer_id": "sup-flag",
            },
        )

        # After review
        after = client.get("/api/v1/inspections").json()
        this_after = next((i for i in after["items"] if i["inspection_id"] == iid), None)
        assert this_after is not None
        assert this_after["has_reviews"] is True
