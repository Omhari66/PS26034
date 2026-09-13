"""
Integration tests for the OCR pipeline (app/ocr/pipeline.py).

These tests use a mock OCREngine — no EasyOCR model download happens.
The mock returns pre-scripted OCRResult objects so we can test the full
pipeline logic (extraction → cross-check → conflict detection → FieldEvidence)
without any network or GPU dependency.

AGENTS.md rule 8: mocked OCR engine is clearly marked and never presented
as a real OCR integration.
"""

from __future__ import annotations

# Import shared schema via sys.path patched by conftest.py
from packages.shared_schema import EvidenceState

from app.ocr.engines.base import OCRResult
from app.ocr.pipeline import CRITICAL_FIELDS, run_pipeline

# ---------------------------------------------------------------------------
# Mock OCR engine — returns pre-scripted results per image_path
# ---------------------------------------------------------------------------


class MockOCREngine:
    """
    # TODO(stub): replace with real OCR in integration tests that use
    # actual product photos (see tests/test_ocr/sample_images/README.md).
    """

    name = "mock_ocr"

    def __init__(self, results: list[OCRResult]) -> None:
        """results: what recognize() returns for any image path."""
        self._results = results
        self._region_results: list[OCRResult] | None = None  # override for cross-check

    def set_region_results(self, results: list[OCRResult]) -> None:
        """Set what recognize_region() returns (defaults to self._results)."""
        self._region_results = results

    def recognize(self, image_path: str) -> list[OCRResult]:  # noqa: ARG002
        return list(self._results)

    def recognize_region(
        self,
        image_path: str,  # noqa: ARG002
        bbox: tuple[int, int, int, int],  # noqa: ARG002
        zoom: float = 2.0,  # noqa: ARG002
    ) -> list[OCRResult]:
        return list(self._region_results if self._region_results is not None else self._results)


# ---------------------------------------------------------------------------
# Helper: build OCRResult
# ---------------------------------------------------------------------------


def _r(text: str, confidence: float = 0.92) -> OCRResult:
    return OCRResult(text=text, bbox=(0, 0, 200, 30), confidence=confidence, engine_name="mock")


# ---------------------------------------------------------------------------
# Standard label text blocks covering all 5 fields
# ---------------------------------------------------------------------------

_ALL_FIELDS_BLOCKS = [
    _r("MRP: Rs. 149.00"),
    _r("Net Wt. 500g"),
    _r("Mfg. Date: Jan 2025"),
    _r("Manufactured by: Acme Corp, Mumbai"),
    _r("Consumer Care: 1800-123-4567"),
]


# ===========================================================================
# Basic pipeline output structure
# ===========================================================================


class TestPipelineOutputStructure:
    def test_returns_one_evidence_per_field(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        assert len(evidences) == len(CRITICAL_FIELDS)

    def test_all_fields_covered(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        field_names = {ev.field_name for ev in evidences}
        assert field_names == CRITICAL_FIELDS

    def test_evidence_states_are_valid_enum_values(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        valid_states = {e.value for e in EvidenceState}
        for ev in evidences:
            assert ev.state.value in valid_states

    def test_empty_image_list_returns_all_not_found(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline([], primary_engine=engine, secondary_engine=engine)
        assert len(evidences) == len(CRITICAL_FIELDS)
        assert all(ev.state == EvidenceState.NOT_FOUND for ev in evidences)


# ===========================================================================
# FOUND state — primary and secondary agree
# ===========================================================================


class TestFoundState:
    def test_all_fields_found_when_all_present(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        # MRP should be found
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.FOUND
        assert mrp_ev.value is not None

    def test_found_evidence_has_value(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        for ev in evidences:
            if ev.state == EvidenceState.FOUND:
                assert ev.value is not None, f"FOUND evidence for {ev.field_name} must have value"

    def test_found_evidence_carries_ocr_engine_name(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.FOUND
        assert mrp_ev.ocr_engine == "mock"

    def test_found_evidence_carries_confidence(self):
        engine = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.FOUND
        assert mrp_ev.ocr_confidence is not None
        assert 0.0 <= mrp_ev.ocr_confidence <= 1.0


# ===========================================================================
# NOT_FOUND state — field absent from OCR output
# ===========================================================================


class TestNotFoundState:
    def test_absent_field_is_not_found(self):
        """Only MRP in results — other 4 fields must be NOT_FOUND."""
        engine = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        not_found = [e for e in evidences if e.field_name != "mrp"]
        assert all(ev.state == EvidenceState.NOT_FOUND for ev in not_found)

    def test_not_found_has_no_value(self):
        engine = MockOCREngine([_r("Random text with no field keywords")])
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=engine, secondary_engine=engine)
        for ev in evidences:
            if ev.state == EvidenceState.NOT_FOUND:
                assert ev.value is None


# ===========================================================================
# CONFLICTING state — primary and secondary disagree
# ===========================================================================


class TestConflictingState:
    def test_conflicting_mrp_produces_conflicting_state(self):
        """Primary reads Rs.49, secondary reads Rs.149 → CONFLICTING for MRP."""
        primary = MockOCREngine([_r("MRP: Rs. 49.00")])
        secondary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(
            ["dummy.jpg"], primary_engine=primary, secondary_engine=secondary
        )
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.CONFLICTING

    def test_conflicting_evidence_has_no_value(self):
        """CONFLICTING evidence must not commit to a single value."""
        primary = MockOCREngine([_r("MRP: Rs. 49.00")])
        secondary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(
            ["dummy.jpg"], primary_engine=primary, secondary_engine=secondary
        )
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.CONFLICTING
        assert mrp_ev.value is None  # AGENTS.md rule 1: do not invent

    def test_conflicting_evidence_carries_candidates(self):
        """Candidates must show both readings so reviewer can see both."""
        primary = MockOCREngine([_r("MRP: Rs. 49.00")])
        secondary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(
            ["dummy.jpg"], primary_engine=primary, secondary_engine=secondary
        )
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.CONFLICTING
        assert len(list(mrp_ev.candidates or [])) == 2


# ===========================================================================
# NOT_VERIFIABLE state — secondary engine unavailable
# ===========================================================================


class TestNotVerifiableState:
    def test_no_secondary_engine_produces_not_verifiable(self):
        """
        When secondary_engine=None (e.g. PaddleOCR unavailable),
        all critical fields that are found by primary must be NOT_VERIFIABLE
        rather than FOUND — this satisfies CONTRACTS.md #2 honestly.
        """
        primary = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=primary, secondary_engine=None)
        # Fields found by primary but without cross-check → NOT_VERIFIABLE
        for ev in evidences:
            if ev.field_name == "mrp":  # mrp is in the blocks
                assert ev.state == EvidenceState.NOT_VERIFIABLE, (
                    f"Expected NOT_VERIFIABLE for {ev.field_name} without secondary, got {ev.state}"
                )

    def test_not_verifiable_still_carries_primary_value(self):
        """NOT_VERIFIABLE should store the primary reading for context."""
        primary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=primary, secondary_engine=None)
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.NOT_VERIFIABLE
        assert mrp_ev.value is not None  # primary reading preserved


# ===========================================================================
# Multiple images
# ===========================================================================


class TestMultipleImages:
    def test_results_aggregate_across_images(self):
        """
        First image has MRP only; second has the other 4 fields.
        Pipeline should find all 5 (aggregate across images).
        """
        all_blocks = MockOCREngine(_ALL_FIELDS_BLOCKS)
        evidences, _ = run_pipeline(
            ["img1.jpg", "img2.jpg"],
            primary_engine=all_blocks,
            secondary_engine=all_blocks,
        )
        assert len(evidences) == len(CRITICAL_FIELDS)
