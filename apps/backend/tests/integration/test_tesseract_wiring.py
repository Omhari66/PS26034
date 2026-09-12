"""
tests/integration/test_tesseract_wiring.py
Verifies: _assert_report_complete, single_engine_only cap, dual-engine PASS path.
Run: uv run pytest tests/integration/test_tesseract_wiring.py -v
"""
import pytest, sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
from packages.shared_schema import Decision, EvidenceState, FieldEvidence, RuleResult, evaluate_field
from app.services.inspection_service import _assert_report_complete

def _rr(state, value=None):
    ev = FieldEvidence(field_name="mrp", state=state, value=value)
    dec = Decision.PASS if (state == EvidenceState.FOUND and value) else Decision.REVIEW
    return RuleResult("LM-MRP-001","v1.0","mrp", dec, "test", ev)

class TestAssertReportComplete:
    def test_found_with_value_passes(self):
        _assert_report_complete([_rr(EvidenceState.FOUND, "199.00")])

    def test_found_without_value_raises(self):
        with pytest.raises(ValueError, match="completeness failure"):
            _assert_report_complete([_rr(EvidenceState.FOUND, None)])

    def test_not_found_no_value_passes(self):
        _assert_report_complete([_rr(EvidenceState.NOT_FOUND, None)])

    def test_not_verifiable_passes(self):
        _assert_report_complete([_rr(EvidenceState.NOT_VERIFIABLE, None)])

class TestSingleEngineOnlyCap:
    def test_single_engine_only_forces_review(self):
        ev = FieldEvidence(field_name="mrp", state=EvidenceState.FOUND,
                           value="199.00", ocr_confidence=0.97, single_engine_only=True)
        r = evaluate_field(ev,"LM-MRP-001","v1.0",required=True,coverage={"front":True,"back":True})
        assert r.decision == Decision.REVIEW
        assert "single engine" in r.reason.lower()

    def test_dual_engine_high_conf_can_pass(self):
        ev = FieldEvidence(field_name="mrp", state=EvidenceState.FOUND,
                           value="199.00", ocr_confidence=0.97, single_engine_only=False)
        r = evaluate_field(ev,"LM-MRP-001","v1.0",required=True,coverage={"front":True,"back":True})
        assert r.decision == Decision.PASS   # interim path: Phase 5 stubs fall through
