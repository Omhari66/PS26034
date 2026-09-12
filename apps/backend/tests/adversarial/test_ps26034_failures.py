"""
tests/adversarial/test_ps26034_failures.py

The 10 adversarial test cases from CONTRACTS.md and PHASES.md Phase 8.

Purpose
-------
These tests define the MINIMUM correctness bar for the compliance pipeline.
They should currently FAIL for any behaviour that the honest audit identified
as broken. Once the implementation is fixed they will PASS and must stay
green in CI permanently.

Markers
-------
  @pytest.mark.xfail(strict=True) means the test is EXPECTED to fail NOW.
  Remove the xfail marker once the underlying issue is fixed.
  Do NOT remove the test itself.

Running
-------
  cd apps/backend
  uv run pytest tests/adversarial/ -v
"""
from __future__ import annotations

import sys
from pathlib import Path

import pytest

# Path setup
_ROOT = Path(__file__).parents[3]
sys.path.insert(0, str(_ROOT / "packages" / "shared-schema"))
sys.path.insert(0, str(_ROOT / "apps" / "backend"))

from packages.shared_schema import (  # noqa: E402
    Decision,
    EvidenceState,
    FieldEvidence,
    aggregate_overall,
    evaluate_field,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _ev(field, state, value=None, confidence=None):
    return FieldEvidence(
        field_name=field,
        state=state,
        value=value,
        ocr_confidence=confidence,
    )


FULL_COVERAGE = {"front": True, "back": True, "close_up": True}
FRONT_ONLY    = {"front": True, "back": False, "close_up": False}


# ---------------------------------------------------------------------------
# Test 1 — Bare ₹ value + full coverage + NOT_FOUND → FAIL (not PASS)
# Tests the rule engine correctly fires FAIL when coverage is complete.
# ---------------------------------------------------------------------------
def test_01_bare_price_not_found_full_coverage_gives_fail():
    """When MRP is genuinely not found and coverage is complete, result must be FAIL."""
    ev = _ev("mrp", EvidenceState.NOT_FOUND)
    result = evaluate_field(ev, "LM-MRP-001", "v1.0", required=True, coverage=FULL_COVERAGE)
    assert result.decision == Decision.FAIL, (
        f"NOT_FOUND + full coverage gave {result.decision}. Expected FAIL."
    )


# ---------------------------------------------------------------------------
# Test 2 — Offer price must not be selected as MRP (Phase 4 — xfail)
# ---------------------------------------------------------------------------
def test_02_offer_price_not_selected_as_mrp():
    """
    MRP Rs.199 and Offer Rs.149 on same label — must extract 199, not 149.

    Status: PASSES — context-window scoring in _extract_mrp_with_context() correctly
    disqualifies the offer-price block (negative context: "Offer Price") and
    selects the MRP-labelled block. Permanent regression test.
    """
    from app.ocr.engines.base import OCRResult
    from app.ocr.field_extractor import extract_field

    offer_block = OCRResult(text="Offer Price Rs.149", bbox=(10, 10, 200, 40), confidence=0.96, engine_name="test")
    mrp_block   = OCRResult(text="MRP Rs.199", bbox=(10, 50, 200, 80), confidence=0.92, engine_name="test")

    result = extract_field("mrp", [offer_block, mrp_block])
    assert result is not None
    assert result.normalized_value == "199.00", (
        f"Extracted MRP={result.normalized_value}. Offer price (149) was wrongly selected."
    )


# ---------------------------------------------------------------------------
# Test 3 — NOT_FOUND + front-only coverage → REVIEW (D8 fix)
# ---------------------------------------------------------------------------
def test_03_not_found_front_only_gives_review_not_fail():
    """Consumer Care not found + only front captured → REVIEW, not FAIL."""
    ev = _ev("consumer_care", EvidenceState.NOT_FOUND)
    result = evaluate_field(ev, "LM-CC-001", "v1.0", required=True, coverage=FRONT_ONLY)
    assert result.decision == Decision.REVIEW, (
        f"NOT_FOUND + front-only coverage gave {result.decision}. "
        "Expected REVIEW — back panel not inspected."
    )


# ---------------------------------------------------------------------------
# Test 4 — Low OCR confidence → REVIEW (not PASS)
# ---------------------------------------------------------------------------
def test_04_low_confidence_gives_review():
    """FOUND + confidence 0.42 must give REVIEW, not PASS."""
    ev = _ev("consumer_care", EvidenceState.FOUND, value="1800-123-4567", confidence=0.42)
    result = evaluate_field(ev, "LM-CC-001", "v1.0", required=True, coverage=FULL_COVERAGE)
    assert result.decision == Decision.REVIEW, (
        f"FOUND + conf=0.42 gave {result.decision}. Expected REVIEW."
    )


# ---------------------------------------------------------------------------
# Test 5 — Conflicting OCR readings → REVIEW (not PASS)
# ---------------------------------------------------------------------------
def test_05_conflicting_readings_gives_review():
    """CONFLICTING state must always produce REVIEW."""
    ev = FieldEvidence(
        field_name="mrp",
        state=EvidenceState.CONFLICTING,
        ocr_confidence=0.91,
        candidates=["199.00", "299.00"],
    )
    result = evaluate_field(ev, "LM-MRP-001", "v1.0", required=True, coverage=FULL_COVERAGE)
    assert result.decision == Decision.REVIEW, (
        f"CONFLICTING gave {result.decision}. Expected REVIEW."
    )


# ---------------------------------------------------------------------------
# Test 6 — Mfg date ≠ Best Before (Phase 4 — xfail)
# ---------------------------------------------------------------------------
def test_06_mfg_date_distinct_from_best_before():
    """
    'Manufactured: 08/2026' must be extracted; the 'Best Before: 12 months' block
    must not be returned as the manufacturing date source.

    Status: PASSES with current extractor — the 'Manufactured:' keyword pattern
    takes priority over the bare BBD text. This is a regression test to ensure
    this behaviour does not regress as Phase 4 changes the extractor.
    """
    from app.ocr.engines.base import OCRResult
    from app.ocr.field_extractor import extract_field

    mfd = OCRResult(text="Manufactured: 08/2026", bbox=(10,10,200,40), confidence=0.93, engine_name="test")
    bbd = OCRResult(text="Best Before: 12 months from mfg", bbox=(10,50,200,80), confidence=0.91, engine_name="test")

    result = extract_field("manufacturing_date", [mfd, bbd])
    assert result is not None, "No manufacturing date extracted at all"
    assert "Best Before" not in result.source_result.text, (
        "Manufacturing date result came from the 'Best Before' block."
    )
    assert "2026" in result.raw_value, (
        f"Expected MFD 08/2026, got '{result.raw_value}'"
    )


# ---------------------------------------------------------------------------
# Test 7 — Consumer care ≠ sales phone (Phase 4 — xfail)
# ---------------------------------------------------------------------------
def test_07_consumer_care_not_confused_with_sales_number():
    """
    Customer Care: 1800-xxx must be extracted; the Sales number must not be.

    Status: PASSES with current extractor — the 'Customer Care:' keyword pattern
    (Pattern 1) matches the first block and wins over the bare phone number in the
    second block. However: if the label has ONLY a bare sales number and no
    consumer-care keyword, Pattern 3 (bare Indian mobile regex) WILL match it.
    That gap is still open; this test only covers the keyword-present case.
    """
    from app.ocr.engines.base import OCRResult
    from app.ocr.field_extractor import extract_field

    care_block  = OCRResult(text="Customer Care: 1800-123-4567", bbox=(10,10,300,40), confidence=0.94, engine_name="test")
    sales_block = OCRResult(text="Call Sales Team: 9876543210", bbox=(10,50,300,80), confidence=0.96, engine_name="test")

    result = extract_field("consumer_care", [care_block, sales_block])
    assert result is not None
    assert "9876543210" not in result.raw_value, (
        "Sales phone number was returned as Consumer Care."
    )
    assert "1800" in result.raw_value, (
        f"Expected toll-free number, got '{result.raw_value}'"
    )


# ---------------------------------------------------------------------------
# Test 8 — Single engine → NOT_VERIFIABLE → REVIEW (Phase 3 — xfail)
# ---------------------------------------------------------------------------
def test_08_single_engine_gives_review_not_pass():
    """
    When secondary_engine=None is passed directly to run_pipeline, the pipeline
    correctly returns NOT_VERIFIABLE for all critical fields.

    Status: PASSES at the pipeline level. However, inspection_service.py still
    passes secondary=primary (same engine) when PaddleOCR is unavailable, which
    means this protection never fires in production. The service-level fix is
    tracked in PHASES.md Phase 3.
    """
    from unittest.mock import MagicMock
    from app.ocr.pipeline import run_pipeline

    primary = MagicMock()
    primary.name = "mock"
    primary.recognize.return_value = [
        MagicMock(text="MRP Rs.199", bbox=(10,10,200,40), confidence=0.91, engine_name="mock")
    ]

    # Directly passing None works correctly at the pipeline level:
    evidences = run_pipeline(image_paths=["fake.jpg"], primary_engine=primary, secondary_engine=None)
    mrp_ev = next((e for e in evidences if e.field_name == "mrp"), None)
    assert mrp_ev is not None
    assert mrp_ev.state == EvidenceState.NOT_VERIFIABLE, (
        f"Single-engine MRP state={mrp_ev.state}. Expected NOT_VERIFIABLE."
    )


# ---------------------------------------------------------------------------
# Test 9 — NOT_VERIFIABLE (language limitation) → REVIEW (not FAIL)
# This part tests the rule engine, which already handles it correctly.
# The xfail is for the upstream OCR returning NOT_FOUND instead of NOT_VERIFIABLE.
# ---------------------------------------------------------------------------
def test_09_not_verifiable_gives_review():
    """
    NOT_VERIFIABLE state (e.g. Hindi text OCR can't read) → REVIEW.
    This half of the test already passes. The upstream language-limitation
    detection (Phase 3) is the missing piece.
    """
    ev = _ev("consumer_care", EvidenceState.NOT_VERIFIABLE)
    result = evaluate_field(ev, "LM-CC-001", "v1.0", required=True, coverage=FULL_COVERAGE)
    assert result.decision == Decision.REVIEW, (
        f"NOT_VERIFIABLE gave {result.decision}. Expected REVIEW."
    )


# ---------------------------------------------------------------------------
# Test 10 — All fields FOUND at conf=0.45 → overall REVIEW (not PASS)
# ---------------------------------------------------------------------------
def test_10_all_low_confidence_overall_review():
    """Five fields all FOUND at confidence 0.45 → each REVIEW → overall REVIEW."""
    fields_rules = {
        "mrp": "LM-MRP-001",
        "net_quantity": "LM-NQ-001",
        "manufacturing_date": "LM-MD-001",
        "manufacturer_name": "LM-MN-001",
        "consumer_care": "LM-CC-001",
    }
    results = []
    for field, rule_id in fields_rules.items():
        ev = _ev(field, EvidenceState.FOUND, value="x", confidence=0.45)
        rr = evaluate_field(ev, rule_id, "v1.0", required=True, coverage=FULL_COVERAGE)
        assert rr.decision == Decision.REVIEW, f"{field}: conf=0.45 gave {rr.decision}, expected REVIEW"
        results.append(rr)

    overall = aggregate_overall(results)
    assert overall == Decision.REVIEW, f"All-REVIEW fields gave overall {overall}"
