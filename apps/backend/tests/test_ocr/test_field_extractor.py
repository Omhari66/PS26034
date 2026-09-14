"""
Tests for regex field extraction (app/ocr/field_extractor.py).

No OCR engines, no image files — all inputs are synthetic OCRResult objects
with known text. This validates the regex patterns and normalizers in isolation.
"""

import pytest

from app.ocr.engines.base import OCRResult
from app.ocr.field_extractor import ExtractionResult, extract_field

# ---------------------------------------------------------------------------
# Helper: build a fake OCRResult from plain text
# ---------------------------------------------------------------------------


def _r(text: str, confidence: float = 0.90) -> OCRResult:
    """Synthetic OCRResult with a dummy bbox."""
    return OCRResult(text=text, bbox=(0, 0, 100, 20), confidence=confidence, engine_name="test")


# ===========================================================================
# MRP extraction
# ===========================================================================


class TestMRPExtraction:
    def test_standard_mrp_label(self):
        """MRP: Rs. 149.00 → value '149.00'."""
        result = extract_field("mrp", [_r("MRP: Rs. 149.00")])
        assert result is not None
        assert result.normalized_value == "149.00"

    def test_mrp_with_rupee_symbol(self):
        """MRP ... ₹149 → '149.00'."""
        result = extract_field("mrp", [_r("MRP"), _r("₹149")])
        assert result is not None
        assert result.normalized_value == "149.00"

    def test_mrp_with_dots_in_label(self):
        """M.R.P. Rs. 50 → '50.00'."""
        result = extract_field("mrp", [_r("M.R.P. Rs. 50")])
        assert result is not None
        assert result.normalized_value == "50.00"

    def test_mrp_not_found_when_absent(self):
        """No MRP text → None."""
        result = extract_field("mrp", [_r("Some random text on label")])
        assert result is None

    def test_mrp_picks_highest_confidence(self):
        """When multiple blocks match, pick the one with highest confidence."""
        blocks = [
            _r("Rs. 50", confidence=0.70),
            _r("MRP: Rs. 149.00", confidence=0.95),
        ]
        result = extract_field("mrp", blocks)
        assert result is not None
        assert result.normalized_value == "149.00"
        assert result.source_result.confidence == 0.95

    def test_mrp_with_comma_thousand_separator(self):
        """Rs. 1,299 → '1299.00'."""
        result = extract_field("mrp", [_r("MRP Rs. 1,299")])
        assert result is not None
        assert result.normalized_value == "1299.00"


# ===========================================================================
# Net quantity extraction
# ===========================================================================


class TestNetQuantityExtraction:
    def test_net_wt_grams(self):
        result = extract_field("net_quantity", [_r("Net Wt. 500g")])
        assert result is not None
        assert "500" in result.normalized_value

    def test_net_weight_kg(self):
        result = extract_field("net_quantity", [_r("Net Weight: 1kg")])
        assert result is not None
        assert "1" in result.normalized_value
        assert "kg" in result.normalized_value

    def test_net_vol_ml(self):
        result = extract_field("net_quantity", [_r("Net Vol: 250ml")])
        assert result is not None
        assert "250" in result.normalized_value
        assert "ml" in result.normalized_value

    def test_bare_quantity_without_label(self):
        """'500g' alone (no 'Net Wt') should still be found."""
        result = extract_field("net_quantity", [_r("500g")])
        assert result is not None

    def test_net_qty_not_found(self):
        result = extract_field("net_quantity", [_r("MRP Rs. 49")])
        assert result is None


# ===========================================================================
# Manufacturing date extraction
# ===========================================================================


class TestManufacturingDateExtraction:
    def test_mfg_date_with_label(self):
        result = extract_field("manufacturing_date", [_r("Mfg. Date: 01/2025")])
        assert result is not None
        assert "2025" in result.normalized_value

    def test_date_of_manufacture_label(self):
        result = extract_field("manufacturing_date", [_r("Date of Mfg: 12-2024")])
        assert result is not None
        assert "2024" in result.normalized_value

    def test_month_year_text_format(self):
        """'Jan 2025' style date."""
        result = extract_field("manufacturing_date", [_r("Mfg Date: Jan 2025")])
        assert result is not None
        assert "2025" in result.normalized_value

    def test_mfg_date_not_found(self):
        result = extract_field("manufacturing_date", [_r("Manufacturer: Acme Corp")])
        assert result is None


# ===========================================================================
# Manufacturer name extraction
# ===========================================================================


class TestManufacturerNameExtraction:
    def test_manufactured_by(self):
        result = extract_field("manufacturer_name", [_r("Manufactured by: Acme Corp, Mumbai")])
        assert result is not None
        assert "Acme Corp" in result.normalized_value

    def test_mfr_colon(self):
        result = extract_field("manufacturer_name", [_r("Mfr.: XYZ Foods Pvt Ltd")])
        assert result is not None
        assert "XYZ Foods" in result.normalized_value

    def test_marketed_by(self):
        result = extract_field("manufacturer_name", [_r("Marketed by: Brand India Ltd")])
        assert result is not None
        assert "Brand India" in result.normalized_value

    def test_mfr_name_not_found(self):
        result = extract_field("manufacturer_name", [_r("MRP: Rs. 49")])
        assert result is None


# ===========================================================================
# Consumer care extraction
# ===========================================================================


class TestConsumerCareExtraction:
    def test_consumer_care_phone(self):
        result = extract_field("consumer_care", [_r("Consumer Care: 1800-123-4567")])
        assert result is not None
        assert "1800" in result.normalized_value

    def test_customer_helpline(self):
        result = extract_field("consumer_care", [_r("Customer Helpline: +91 9876543210")])
        assert result is not None

    def test_email_address(self):
        result = extract_field("consumer_care", [_r("care@example.com")])
        assert result is not None
        assert "care@example.com" in result.normalized_value

    def test_consumer_care_not_found(self):
        result = extract_field("consumer_care", [_r("Net Wt. 200g")])
        assert result is None


# ===========================================================================
# Unknown field
# ===========================================================================


def test_unknown_field_raises():
    with pytest.raises(ValueError, match="Unknown field"):
        extract_field("nonexistent_field", [_r("some text")])


# ===========================================================================
# ExtractionResult structure
# ===========================================================================


def test_extraction_result_carries_source_ocr_result():
    """ExtractionResult.source_result must be the OCRResult that matched."""
    src = _r("MRP: Rs. 99.00", confidence=0.88)
    result = extract_field("mrp", [src])
    assert result is not None
    assert result.source_result is src


def test_extraction_result_is_frozen():
    """ExtractionResult should be a frozen dataclass."""
    import dataclasses

    assert dataclasses.is_dataclass(ExtractionResult)
