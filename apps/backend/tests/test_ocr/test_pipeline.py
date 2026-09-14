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

    def test_conflicting_evidence_preserves_secondary_value(self):
        """Secondary value must be preserved on conflict for reviewer inspection."""
        primary = MockOCREngine([_r("MRP: Rs. 49.00")])
        secondary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(
            ["dummy.jpg"], primary_engine=primary, secondary_engine=secondary
        )
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.CONFLICTING
        assert mrp_ev.value is None
        assert mrp_ev.secondary_value == "149.00"
        assert mrp_ev.candidates == ["49.00", "149.00"]


# ===========================================================================
# Secondary engine unavailable / failure → single_engine_only
# ===========================================================================


class TestSecondaryUnavailableState:
    def test_no_secondary_engine_preserves_found_and_sets_single_engine(self):
        """
        When secondary_engine=None, primary FOUND evidence is preserved,
        single_engine_only=True is set, and state is NOT converted to NOT_VERIFIABLE.
        """
        primary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=primary, secondary_engine=None)
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.FOUND
        assert mrp_ev.value == "149.00"
        assert mrp_ev.single_engine_only is True

    def test_no_secondary_engine_preserves_not_found_with_single_engine(self):
        """When secondary_engine=None and primary finds nothing, state remains NOT_FOUND."""
        primary = MockOCREngine([_r("MRP: Rs. 149.00")])
        evidences, _ = run_pipeline(["dummy.jpg"], primary_engine=primary, secondary_engine=None)
        absent_ev = next(e for e in evidences if e.field_name == "net_quantity")
        assert absent_ev.state == EvidenceState.NOT_FOUND
        assert absent_ev.single_engine_only is True

    def test_secondary_exception_preserves_primary_and_sets_single_engine(self):
        """
        When secondary engine raises an exception during recognize_region,
        primary evidence is preserved and single_engine_only=True is set.
        """
        primary = MockOCREngine([_r("MRP: Rs. 149.00")])

        class FailingSecondary(MockOCREngine):
            def recognize_region(self, image_path, bbox, zoom=2.0):
                raise RuntimeError("Tesseract process crashed")

        secondary = FailingSecondary([])
        evidences, _ = run_pipeline(
            ["dummy.jpg"], primary_engine=primary, secondary_engine=secondary
        )
        mrp_ev = next(e for e in evidences if e.field_name == "mrp")
        assert mrp_ev.state == EvidenceState.FOUND
        assert mrp_ev.value == "149.00"
        assert mrp_ev.single_engine_only is True
        assert mrp_ev.secondary_value is None

    def test_tesseract_engine_protocol_conformance(self):
        """TesseractEngine.recognize_region must accept zoom and conform to OCREngine protocol."""
        import inspect

        from app.ocr.engines.tesseract_engine import TesseractEngine

        sig = inspect.signature(TesseractEngine.recognize_region)
        assert "zoom" in sig.parameters
        assert sig.parameters["zoom"].default == 2.0
        assert hasattr(TesseractEngine, "name")
        assert callable(getattr(TesseractEngine, "recognize"))
        assert callable(getattr(TesseractEngine, "recognize_region"))


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
