"""
Tests for conflict detection (app/ocr/conflict.py).

Pure logic — no OCR engines, no image files.
Validates the numeric tolerance, unit comparison, and text-similarity rules.
"""

import pytest

from app.ocr.conflict import detect_conflict
from app.ocr.engines.base import OCRResult
from app.ocr.field_extractor import ExtractionResult

# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------


def _ext(field: str, norm_value: str) -> ExtractionResult:
    src = OCRResult(text=norm_value, bbox=(0, 0, 50, 10), confidence=0.90, engine_name="test")
    return ExtractionResult(
        field_name=field,
        raw_value=norm_value,
        normalized_value=norm_value,
        source_result=src,
    )


# ===========================================================================
# MRP (numeric field)
# ===========================================================================


class TestMRPConflict:
    def test_exact_match_no_conflict(self):
        p = _ext("mrp", "149.00")
        s = _ext("mrp", "149.00")
        is_c, _ = detect_conflict(p, s)
        assert is_c is False

    def test_within_5pct_no_conflict(self):
        """149.00 vs 151.00 — differ by ~1.3% → no conflict."""
        p = _ext("mrp", "149.00")
        s = _ext("mrp", "151.00")
        is_c, _ = detect_conflict(p, s)
        assert is_c is False

    def test_over_5pct_is_conflict(self):
        """149.00 vs 200.00 — differ by ~25% → conflict."""
        p = _ext("mrp", "149.00")
        s = _ext("mrp", "200.00")
        is_c, candidates = detect_conflict(p, s)
        assert is_c is True
        assert "149.00" in candidates
        assert "200.00" in candidates

    def test_obvious_misread_is_conflict(self):
        """'49.00' vs '149.00' — digit drop → conflict."""
        p = _ext("mrp", "49.00")
        s = _ext("mrp", "149.00")
        is_c, _ = detect_conflict(p, s)
        assert is_c is True


# ===========================================================================
# Net quantity (numeric + unit field)
# ===========================================================================


class TestNetQuantityConflict:
    def test_same_value_and_unit_no_conflict(self):
        p = _ext("net_quantity", "500g")
        s = _ext("net_quantity", "500g")
        is_c, _ = detect_conflict(p, s)
        assert is_c is False

    def test_different_unit_is_conflict(self):
        """500g vs 500ml — different units → conflict."""
        p = _ext("net_quantity", "500g")
        s = _ext("net_quantity", "500ml")
        is_c, _ = detect_conflict(p, s)
        assert is_c is True

    def test_slight_numeric_difference_no_conflict(self):
        """500g vs 502g — within tolerance → no conflict."""
        p = _ext("net_quantity", "500g")
        s = _ext("net_quantity", "502g")
        is_c, _ = detect_conflict(p, s)
        assert is_c is False

    def test_large_numeric_difference_is_conflict(self):
        """100g vs 500g → conflict."""
        p = _ext("net_quantity", "100g")
        s = _ext("net_quantity", "500g")
        is_c, _ = detect_conflict(p, s)
        assert is_c is True


# ===========================================================================
# Text fields (manufacturing_date, manufacturer_name, consumer_care)
# ===========================================================================


class TestTextFieldConflict:
    @pytest.mark.parametrize("field", ["manufacturing_date", "manufacturer_name", "consumer_care"])
    def test_identical_text_no_conflict(self, field: str):
        p = _ext(field, "some value here")
        s = _ext(field, "some value here")
        is_c, _ = detect_conflict(p, s)
        assert is_c is False

    @pytest.mark.parametrize("field", ["manufacturing_date", "manufacturer_name", "consumer_care"])
    def test_case_and_punctuation_difference_no_conflict(self, field: str):
        """Minor formatting differences should not trigger a conflict."""
        p = _ext(field, "Acme Corp.")
        s = _ext(field, "acme corp")
        is_c, _ = detect_conflict(p, s)
        assert is_c is False

    def test_completely_different_names_is_conflict(self):
        p = _ext("manufacturer_name", "Acme Foods Pvt Ltd Mumbai")
        s = _ext("manufacturer_name", "XYZ Beverages Bangalore")
        is_c, _ = detect_conflict(p, s)
        assert is_c is True

    def test_different_dates_is_conflict(self):
        p = _ext("manufacturing_date", "01/2025")
        s = _ext("manufacturing_date", "06/2024")
        is_c, _ = detect_conflict(p, s)
        assert is_c is True

    def test_different_phone_numbers_is_conflict(self):
        p = _ext("consumer_care", "1800-123-4567")
        s = _ext("consumer_care", "1800-999-8888")
        is_c, _ = detect_conflict(p, s)
        assert is_c is True


# ===========================================================================
# candidates list
# ===========================================================================


def test_conflict_candidates_contains_both_values():
    p = _ext("mrp", "49.00")
    s = _ext("mrp", "149.00")
    is_c, candidates = detect_conflict(p, s)
    assert is_c is True
    assert len(candidates) == 2
    assert "49.00" in candidates
    assert "149.00" in candidates


def test_no_conflict_still_returns_candidates():
    """Even when no conflict, candidates always contain both values."""
    p = _ext("mrp", "149.00")
    s = _ext("mrp", "149.50")
    is_c, candidates = detect_conflict(p, s)
    assert is_c is False
    assert len(candidates) == 2


# ===========================================================================
# Guard: mismatched field names
# ===========================================================================


def test_mismatched_fields_raise():
    p = _ext("mrp", "149.00")
    s = _ext("net_quantity", "500g")
    with pytest.raises(AssertionError):
        detect_conflict(p, s)
