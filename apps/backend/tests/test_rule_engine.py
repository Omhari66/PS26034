"""
Regression test suite for the rule engine — Phase 1 Definition of Done.

Tests evaluate_field and aggregate_overall as pure functions.
These tests require NO database, NO HTTP client, NO OCR — pure inputs → outputs.

5 test cases × 5 MVP fields = 25 parametrized tests for evaluate_field.
Plus aggregation priority tests and edge cases.

CONTRACTS.md #5: "This is the one module that should have a full
regression-test suite per rule."
"""

import pytest
from packages.shared_schema import (
    Decision,
    EvidenceState,
    FieldEvidence,
    RuleResult,
    aggregate_overall,
    evaluate_field,
)

from app.services.applicability import CURRENT_RULE_VERSION, get_rules
from app.services.inspection_service import RULE_VERSION

# ---------------------------------------------------------------------------
# Test parameters
# ---------------------------------------------------------------------------

# Build the field → rule_id map from the applicability engine (Phase 4 source).
# This replaces the hard-coded FIELD_RULE_MAP that lived in inspection_service.
_packaged_food_rules = get_rules("packaged_food", CURRENT_RULE_VERSION)
FIELD_RULE_MAP: dict[str, str] = {
    fr.field: fr.rule_id for fr in _packaged_food_rules.fields
}

# The 5 MVP declarations checked by the Legal Metrology Act.
MVP_FIELDS = list(FIELD_RULE_MAP.keys())  # mrp, net_quantity, manufacturing_date, ...

# Parametrize all 5 cases × 5 fields with readable IDs.
_field_ids = MVP_FIELDS


# ---------------------------------------------------------------------------
# Case 1 — present + valid → PASS
# ---------------------------------------------------------------------------


_VALID_MOCK_VALUES = {
    "mrp": "149.00",
    "net_quantity": "500g",
    "manufacturing_date": "01/2025",
    "manufacturer_name": '[{"role": "manufactured by", "entity": "Acme Corp"}]',
    "consumer_care": "1800-123-456",
}

@pytest.mark.parametrize("field_name", MVP_FIELDS, ids=_field_ids)
def test_found_valid_passes(field_name: str) -> None:
    """A FOUND field with good OCR confidence and required=True → PASS."""
    evidence = FieldEvidence(
        field_name=field_name,
        state=EvidenceState.FOUND,
        value=_VALID_MOCK_VALUES.get(field_name, "value"),
        source_image="front.jpg",
        bbox=(10, 20, 200, 80),
        ocr_engine="paddleocr",
        ocr_confidence=0.92,
    )
    result = evaluate_field(evidence, FIELD_RULE_MAP[field_name], RULE_VERSION, required=True, coverage={"front": True, "back": True})
    assert result.decision == Decision.PASS
    assert result.field_name == field_name
    assert result.rule_version == RULE_VERSION


# ---------------------------------------------------------------------------
# Case 2 — absent + sufficient coverage → FAIL
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field_name", MVP_FIELDS, ids=_field_ids)
def test_not_found_required_fails(field_name: str) -> None:
    """A NOT_FOUND field on a required declaration → FAIL."""
    evidence = FieldEvidence(
        field_name=field_name,
        state=EvidenceState.NOT_FOUND,
    )
    # Coverage must be complete to assert absence
    result = evaluate_field(evidence, FIELD_RULE_MAP[field_name], RULE_VERSION, required=True, coverage={"front": True, "back": True})
    assert result.decision == Decision.FAIL


# ---------------------------------------------------------------------------
# Case 3 — unreadable (NOT_VERIFIABLE) → REVIEW
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field_name", MVP_FIELDS, ids=_field_ids)
def test_not_verifiable_routes_to_review(field_name: str) -> None:
    """Insufficient coverage/quality → REVIEW, never a confident PASS or FAIL."""
    evidence = FieldEvidence(
        field_name=field_name,
        state=EvidenceState.NOT_VERIFIABLE,
        image_quality="low",
    )
    result = evaluate_field(evidence, FIELD_RULE_MAP[field_name], RULE_VERSION, required=True)
    assert result.decision == Decision.REVIEW


# ---------------------------------------------------------------------------
# Case 4 — conflicting readings → REVIEW
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field_name", MVP_FIELDS, ids=_field_ids)
def test_conflicting_routes_to_review(field_name: str) -> None:
    """Two disagreeing readings → REVIEW (CONTRACTS.md #3: never silently pick one)."""
    evidence = FieldEvidence(
        field_name=field_name,
        state=EvidenceState.CONFLICTING,
        candidates=["reading_A", "reading_B"],
    )
    result = evaluate_field(evidence, FIELD_RULE_MAP[field_name], RULE_VERSION, required=True)
    assert result.decision == Decision.REVIEW


# ---------------------------------------------------------------------------
# Case 5 — field not required for category → NOT_APPLICABLE
# (Represents the "unsupported category" outcome at the per-field level)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("field_name", MVP_FIELDS, ids=_field_ids)
def test_not_found_not_required_is_not_applicable(field_name: str) -> None:
    """A field not required for this category, and not found → NOT_APPLICABLE."""
    evidence = FieldEvidence(
        field_name=field_name,
        state=EvidenceState.NOT_FOUND,
    )
    result = evaluate_field(evidence, FIELD_RULE_MAP[field_name], RULE_VERSION, required=False)
    assert result.decision == Decision.NOT_APPLICABLE


# ---------------------------------------------------------------------------
# Edge cases for evaluate_field
# ---------------------------------------------------------------------------


def test_found_low_confidence_routes_to_review() -> None:
    """FOUND + confidence below threshold (< 0.6) → REVIEW, not PASS."""
    evidence = FieldEvidence(
        field_name="mrp",
        state=EvidenceState.FOUND,
        value="149.00",
        ocr_confidence=0.45,
    )
    result = evaluate_field(evidence, "LM-MRP-001", RULE_VERSION, required=True)
    assert result.decision == Decision.REVIEW


def test_found_at_confidence_boundary_passes() -> None:
    """FOUND + confidence exactly at 0.6 → PASS (boundary: < 0.6 is REVIEW, ≥ 0.6 is PASS)."""
    evidence = FieldEvidence(
        field_name="mrp",
        state=EvidenceState.FOUND,
        value="149.00",
        ocr_confidence=0.6,
    )
    result = evaluate_field(evidence, "LM-MRP-001", RULE_VERSION, required=True)
    assert result.decision == Decision.PASS


def test_found_no_confidence_field_passes() -> None:
    """FOUND with no confidence score (e.g. hand-crafted fixture) → PASS."""
    evidence = FieldEvidence(
        field_name="net_quantity",
        state=EvidenceState.FOUND,
        value="500g",
        ocr_confidence=None,
    )
    result = evaluate_field(evidence, "LM-NQ-001", RULE_VERSION, required=True)
    assert result.decision == Decision.PASS


def test_result_carries_original_evidence() -> None:
    """The RuleResult must reference the exact FieldEvidence passed in — no mutation."""
    evidence = FieldEvidence(
        field_name="mrp",
        state=EvidenceState.FOUND,
        value="149.00",
        bbox=(10, 20, 200, 80),
        ocr_confidence=0.92,
    )
    result = evaluate_field(evidence, "LM-MRP-001", RULE_VERSION)
    assert result.evidence is evidence  # same object, not a copy


# ---------------------------------------------------------------------------
# aggregate_overall priority tests
# ---------------------------------------------------------------------------


def _make_result(field: str, decision: Decision) -> RuleResult:
    ev = FieldEvidence(field_name=field, state=EvidenceState.FOUND)
    return RuleResult(
        rule_id="TEST-001",
        rule_version=RULE_VERSION,
        field_name=field,
        decision=decision,
        reason="test",
        evidence=ev,
    )


def test_aggregate_category_not_supported_beats_all() -> None:
    """CATEGORY_NOT_SUPPORTED has highest priority — beats FAIL, REVIEW, PASS."""
    results = [
        _make_result("mrp", Decision.PASS),
        _make_result("net_quantity", Decision.FAIL),
        _make_result("category", Decision.CATEGORY_NOT_SUPPORTED),
    ]
    assert aggregate_overall(results) == Decision.CATEGORY_NOT_SUPPORTED


def test_aggregate_fail_beats_review_and_pass() -> None:
    """FAIL beats REVIEW and PASS."""
    results = [
        _make_result("mrp", Decision.PASS),
        _make_result("net_quantity", Decision.REVIEW),
        _make_result("manufacturing_date", Decision.FAIL),
        _make_result("manufacturer_name", Decision.PASS),
    ]
    assert aggregate_overall(results) == Decision.FAIL


def test_aggregate_review_beats_pass_and_not_applicable() -> None:
    """REVIEW beats PASS and NOT_APPLICABLE (but not FAIL)."""
    results = [
        _make_result("mrp", Decision.PASS),
        _make_result("net_quantity", Decision.NOT_APPLICABLE),
        _make_result("manufacturing_date", Decision.REVIEW),
    ]
    assert aggregate_overall(results) == Decision.REVIEW


def test_aggregate_all_pass_is_pass() -> None:
    """All fields PASS → overall PASS."""
    results = [_make_result(f, Decision.PASS) for f in MVP_FIELDS]
    assert aggregate_overall(results) == Decision.PASS


def test_aggregate_empty_results_returns_review() -> None:
    """No results → REVIEW (safe default, see compliance_engine.py)."""
    assert aggregate_overall([]) == Decision.REVIEW


# ---------------------------------------------------------------------------
# Mixed-state end-to-end rule engine test (no DB, no HTTP)
# ---------------------------------------------------------------------------


def test_mixed_state_inspection_produces_fail() -> None:
    """
    Full mixed-state fixture exercising the engine end-to-end without the HTTP layer.

    Evidence:
      mrp              FOUND  confidence=0.94  → PASS
      net_quantity     FOUND  confidence=0.91  → PASS
      manufacturing_dt NOT_VERIFIABLE           → REVIEW
      manufacturer_nm  FOUND  confidence=0.88  → PASS
      consumer_care    NOT_FOUND + required     → FAIL

    Priority: FAIL > REVIEW → overall = FAIL
    """
    evidences = [
        FieldEvidence("mrp", EvidenceState.FOUND, value="149.00",
                      source_image="front.jpg", bbox=(0, 0, 100, 50),
                      ocr_engine="paddleocr", ocr_confidence=0.94),
        FieldEvidence("net_quantity", EvidenceState.FOUND, value="500g",
                      ocr_engine="paddleocr", ocr_confidence=0.91),
        FieldEvidence("manufacturing_date", EvidenceState.NOT_VERIFIABLE,
                      image_quality="low"),
        FieldEvidence("manufacturer_name", EvidenceState.FOUND, value='[{"role": "manufactured by", "entity": "Acme Corp"}]',
                      ocr_engine="paddleocr", ocr_confidence=0.88),
        FieldEvidence("consumer_care", EvidenceState.NOT_FOUND),
    ]

    results = [
        evaluate_field(ev, FIELD_RULE_MAP[ev.field_name], RULE_VERSION, required=True, coverage={"front": True, "back": True})
        for ev in evidences
    ]

    decisions = {r.field_name: r.decision for r in results}
    assert decisions["mrp"] == Decision.PASS
    assert decisions["net_quantity"] == Decision.PASS
    assert decisions["manufacturing_date"] == Decision.REVIEW
    assert decisions["manufacturer_name"] == Decision.PASS
    assert decisions["consumer_care"] == Decision.FAIL

    overall = aggregate_overall(results)
    assert overall == Decision.FAIL


_VALID_MOCK_VALUES = {
    "mrp": "149.00",
    "net_quantity": "500g",
    "manufacturing_date": "01/2024",
    "manufacturer_name": '[{"role": "manufactured by", "entity": "Acme Corp"}]',
    "consumer_care": "1800-123-4567",
}


def test_all_found_high_confidence_is_pass() -> None:
    """All 5 fields FOUND with high confidence → overall PASS."""
    evidences = [
        FieldEvidence(f, EvidenceState.FOUND, value=_VALID_MOCK_VALUES.get(f, "value"),
                      ocr_confidence=0.95, ocr_engine="paddleocr")
        for f in MVP_FIELDS
    ]
    results = [
        evaluate_field(ev, FIELD_RULE_MAP[ev.field_name], RULE_VERSION, required=True, coverage={"front": True, "back": True})
        for ev in evidences
    ]
    assert aggregate_overall(results) == Decision.PASS


def test_one_not_verifiable_no_fail_is_review() -> None:
    """4 fields PASS, 1 NOT_VERIFIABLE, no FAIL → overall REVIEW."""
    evidences = [
        FieldEvidence("mrp", EvidenceState.FOUND, value="149.00", ocr_confidence=0.95),
        FieldEvidence("net_quantity", EvidenceState.FOUND, value="500g", ocr_confidence=0.91),
        FieldEvidence("manufacturing_date", EvidenceState.NOT_VERIFIABLE, image_quality="low"),
        FieldEvidence("manufacturer_name", EvidenceState.FOUND, value="Acme", ocr_confidence=0.88),
        FieldEvidence("consumer_care", EvidenceState.FOUND, value="1800-xxx", ocr_confidence=0.85),
    ]
    results = [
        evaluate_field(ev, FIELD_RULE_MAP[ev.field_name], RULE_VERSION, required=True)
        for ev in evidences
    ]
    assert aggregate_overall(results) == Decision.REVIEW
