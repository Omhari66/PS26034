"""
tests/test_phase2_5_adversarial.py

Phase 2.5: Deep Field Validators and Legal Metrology Adversarial Tests.
Owned by: Member 5 (Rahman - Legal and Compliance Engine)
"""

import pytest
from packages.shared_schema import (
    Decision,
    EvidenceState,
    FieldEvidence,
    aggregate_overall,
    evaluate_field,
)

RULE_VERSION = "v1.0"
FULL_COVERAGE = {"front": True, "back": True, "close_up": True}
FRONT_ONLY = {"front": True, "back": False, "close_up": False}
BACK_ONLY = {"front": False, "back": True, "close_up": False}


# ===========================================================================
# 1. CONSUMER CARE ADVERSARIAL TESTS (LM-CC-001)
# ===========================================================================


def test_cc_missing_full_coverage_fails():
    """Missing Consumer Care on fully photographed package MUST fail."""
    evidence = FieldEvidence(field_name="consumer_care", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(evidence, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.FAIL
    assert "required but not found" in res.reason.lower()


def test_cc_missing_front_only_gives_review():
    """Missing Consumer Care on front-only capture must NOT fail; routes to REVIEW."""
    evidence = FieldEvidence(field_name="consumer_care", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(evidence, "LM-CC-001", RULE_VERSION, required=True, coverage=FRONT_ONLY)
    assert res.decision == Decision.REVIEW
    assert "coverage is incomplete" in res.reason.lower()


def test_cc_bare_contact_routes_to_review():
    """
    A bare phone/email (like factory phone) without consumer care keyword
    must route to REVIEW to avoid mistaking factory contact for customer care.
    """
    evidence = FieldEvidence(
        field_name="consumer_care",
        state=EvidenceState.FOUND,
        value="UNVERIFIED_BARE_CONTACT:022-28282828",
        ocr_confidence=0.95,
    )
    res = evaluate_field(evidence, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.REVIEW
    assert "consumer care context keywords" in res.reason.lower()


def test_cc_valid_tollfree_passes():
    """Valid toll-free number with good confidence passes."""
    evidence = FieldEvidence(
        field_name="consumer_care",
        state=EvidenceState.FOUND,
        value="1800-209-1234",
        ocr_confidence=0.91,
    )
    res = evaluate_field(evidence, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_cc_valid_email_passes():
    """Valid care email passes."""
    evidence = FieldEvidence(
        field_name="consumer_care",
        state=EvidenceState.FOUND,
        value="feedback@brandcare.in",
        ocr_confidence=0.88,
    )
    res = evaluate_field(evidence, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_cc_low_confidence_routes_to_review():
    """Consumer care found but with low OCR confidence (< 0.60) routes to REVIEW."""
    evidence = FieldEvidence(
        field_name="consumer_care",
        state=EvidenceState.FOUND,
        value="1800-111-2222",
        ocr_confidence=0.45,
    )
    res = evaluate_field(evidence, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.REVIEW
    assert "confidence too low" in res.reason.lower()


# ===========================================================================
# 2. MANUFACTURER AND PACKER ADVERSARIAL TESTS (LM-MN-001)
# ===========================================================================


def test_mn_marketed_by_only_routes_to_review():
    """
    Legal Metrology requires 'Manufactured by' or 'Packed by'.
    Showing ONLY 'Marketed by' without the manufacturer/packer entity must NOT pass.
    """
    evidence = FieldEvidence(
        field_name="manufacturer_name",
        state=EvidenceState.FOUND,
        value='[{"role": "marketed by", "entity": "Marketing Giant India Pvt Ltd"}]',
        ocr_confidence=0.92,
    )
    res = evaluate_field(evidence, "LM-MN-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.REVIEW
    assert "missing required 'manufactured by' or 'packed by'" in res.reason.lower()


def test_mn_manufactured_by_passes():
    """Valid 'Manufactured by' entity passes."""
    evidence = FieldEvidence(
        field_name="manufacturer_name",
        state=EvidenceState.FOUND,
        value='[{"role": "manufactured by", "entity": "Hindustan Food Works Ltd"}]',
        ocr_confidence=0.94,
    )
    res = evaluate_field(evidence, "LM-MN-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_mn_packed_by_passes():
    """Valid 'Packed by' entity passes."""
    evidence = FieldEvidence(
        field_name="manufacturer_name",
        state=EvidenceState.FOUND,
        value='[{"role": "packed by", "entity": "Southern Packaging Hub"}]',
        ocr_confidence=0.90,
    )
    res = evaluate_field(evidence, "LM-MN-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_mn_both_mfr_and_marketed_passes():
    """Having both 'Manufactured by' and 'Marketed by' passes."""
    evidence = FieldEvidence(
        field_name="manufacturer_name",
        state=EvidenceState.FOUND,
        value=(
            '[{"role": "manufactured by", "entity": "ABC Agro"}, '
            '{"role": "marketed by", "entity": "XYZ Retail"}]'
        ),
        ocr_confidence=0.93,
    )
    res = evaluate_field(evidence, "LM-MN-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_mn_missing_full_coverage_fails():
    """Missing manufacturer details on full coverage fails."""
    evidence = FieldEvidence(field_name="manufacturer_name", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(evidence, "LM-MN-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.FAIL


# ===========================================================================
# 3. MRP ADVERSARIAL TESTS (LM-MRP-001)
# ===========================================================================


def test_mrp_valid_passes():
    evidence = FieldEvidence(
        field_name="mrp", state=EvidenceState.FOUND, value="199.00", ocr_confidence=0.92
    )
    res = evaluate_field(
        evidence, "LM-MRP-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )
    assert res.decision == Decision.PASS


def test_mrp_non_numeric_routes_to_review():
    """OCR hallucination or OCR error like '1O9.00' (letter O) routes to REVIEW."""
    evidence = FieldEvidence(
        field_name="mrp", state=EvidenceState.FOUND, value="1O9.00", ocr_confidence=0.92
    )
    res = evaluate_field(
        evidence, "LM-MRP-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )
    assert res.decision == Decision.REVIEW
    assert "invalid mrp format" in res.reason.lower()


def test_mrp_missing_full_coverage_fails():
    evidence = FieldEvidence(field_name="mrp", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(
        evidence, "LM-MRP-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )
    assert res.decision == Decision.FAIL


# ===========================================================================
# 4. NET QUANTITY ADVERSARIAL TESTS (LM-NQ-001)
# ===========================================================================


@pytest.mark.parametrize("qty", ["500g", "1kg", "200ml", "1l", "16fl oz"])
def test_nq_valid_units_pass(qty: str):
    evidence = FieldEvidence(
        field_name="net_quantity", state=EvidenceState.FOUND, value=qty, ocr_confidence=0.90
    )
    res = evaluate_field(evidence, "LM-NQ-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_nq_missing_unit_routes_to_review():
    """Bare numbers without legal unit ('500' without 'g' or 'ml') must route to REVIEW."""
    evidence = FieldEvidence(
        field_name="net_quantity", state=EvidenceState.FOUND, value="500", ocr_confidence=0.90
    )
    res = evaluate_field(evidence, "LM-NQ-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.REVIEW
    assert "invalid unit" in res.reason.lower()


def test_nq_missing_full_coverage_fails():
    evidence = FieldEvidence(field_name="net_quantity", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(evidence, "LM-NQ-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.FAIL


# ===========================================================================
# 5. AGGREGATION & OVERALL DECISION RULES
# ===========================================================================


def test_aggregation_single_fail_causes_overall_fail():
    """Even if 4 fields PASS, 1 FAIL (e.g. missing consumer care) results in overall FAIL."""
    ev_pass = FieldEvidence(
        field_name="mrp", state=EvidenceState.FOUND, value="100.00", ocr_confidence=0.9
    )
    ev_fail = FieldEvidence(field_name="consumer_care", state=EvidenceState.NOT_FOUND)

    res_pass = evaluate_field(
        ev_pass, "LM-MRP-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )
    res_fail = evaluate_field(
        ev_fail, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )

    overall = aggregate_overall([res_pass, res_fail])
    assert overall == Decision.FAIL


def test_aggregation_review_beats_pass():
    """If no FAIL exists but one field is REVIEW, overall result is REVIEW."""
    ev_pass = FieldEvidence(
        field_name="mrp", state=EvidenceState.FOUND, value="100.00", ocr_confidence=0.9
    )
    ev_rev = FieldEvidence(
        field_name="consumer_care",
        state=EvidenceState.FOUND,
        value="UNVERIFIED_BARE_CONTACT:123",
        ocr_confidence=0.9,
    )

    res_pass = evaluate_field(
        ev_pass, "LM-MRP-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )
    res_rev = evaluate_field(
        ev_rev, "LM-CC-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )

    overall = aggregate_overall([res_pass, res_rev])
    assert overall == Decision.REVIEW


# ===========================================================================
# 6. DATE ADVERSARIAL TESTS (LM-MD-001)
# ===========================================================================


def test_date_valid_passes():
    evidence = FieldEvidence(
        field_name="manufacturing_date",
        state=EvidenceState.FOUND,
        value="01/2025",
        ocr_confidence=0.85,
    )
    res = evaluate_field(evidence, "LM-MD-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.PASS


def test_date_low_confidence_routes_to_review():
    evidence = FieldEvidence(
        field_name="manufacturing_date",
        state=EvidenceState.FOUND,
        value="01/2025",
        ocr_confidence=0.45,
    )
    res = evaluate_field(evidence, "LM-MD-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.REVIEW


def test_date_missing_full_coverage_fails():
    evidence = FieldEvidence(field_name="manufacturing_date", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(evidence, "LM-MD-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE)
    assert res.decision == Decision.FAIL


def test_date_missing_front_only_gives_review():
    evidence = FieldEvidence(field_name="manufacturing_date", state=EvidenceState.NOT_FOUND)
    res = evaluate_field(evidence, "LM-MD-001", RULE_VERSION, required=True, coverage=FRONT_ONLY)
    assert res.decision == Decision.REVIEW


def test_single_engine_only_caps_at_review():
    evidence = FieldEvidence(
        field_name="mrp",
        state=EvidenceState.FOUND,
        value="199.00",
        ocr_confidence=0.92,
        single_engine_only=True,
    )
    res = evaluate_field(
        evidence, "LM-MRP-001", RULE_VERSION, required=True, coverage=FULL_COVERAGE
    )
    assert res.decision == Decision.REVIEW
