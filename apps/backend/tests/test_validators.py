import json
import pytest

# We import the validators directly to test them independently of the router.
from packages.shared_schema.compliance_engine import (
    FieldEvidence,
    EvidenceState,
    Decision,
    FieldRule,
    validate_mrp,
    validate_quantity,
    validate_date,
    validate_manufacturer,
    validate_consumer_care,
)

@pytest.fixture
def dummy_rule():
    return FieldRule(rule_id="LM-TEST", rule_version="v1.0", required=True)

def _build_evidence(field_name, value, confidence=0.9):
    return FieldEvidence(
        field_name=field_name,
        state=EvidenceState.FOUND,
        value=value,
        ocr_confidence=confidence
    )

def test_validate_mrp(dummy_rule):
    # Pass
    ev = _build_evidence("mrp", "149.00")
    res = validate_mrp(ev, {}, dummy_rule)
    assert res.decision == Decision.PASS
    
    # Missing value
    ev_miss = _build_evidence("mrp", None)
    res_miss = validate_mrp(ev_miss, {}, dummy_rule)
    assert res_miss.decision == Decision.REVIEW
    
    # Bad format
    ev_bad = _build_evidence("mrp", "149.xx")
    res_bad = validate_mrp(ev_bad, {}, dummy_rule)
    assert res_bad.decision == Decision.REVIEW

def test_validate_quantity(dummy_rule):
    ev = _build_evidence("net_quantity", "500g")
    assert validate_quantity(ev, {}, dummy_rule).decision == Decision.PASS
    
    ev_bad = _build_evidence("net_quantity", "500")
    assert validate_quantity(ev_bad, {}, dummy_rule).decision == Decision.REVIEW
    
    ev_miss = _build_evidence("net_quantity", None)
    assert validate_quantity(ev_miss, {}, dummy_rule).decision == Decision.REVIEW

def test_validate_manufacturer(dummy_rule):
    # Valid: Manufactured by
    pairs = [{"role": "manufactured by", "entity": "Acme Corp"}]
    ev = _build_evidence("manufacturer_name", json.dumps(pairs))
    assert validate_manufacturer(ev, {}, dummy_rule).decision == Decision.PASS
    
    # Valid: Packed by
    pairs = [{"role": "packed by", "entity": "Acme Corp"}]
    ev = _build_evidence("manufacturer_name", json.dumps(pairs))
    assert validate_manufacturer(ev, {}, dummy_rule).decision == Decision.PASS
    
    # Invalid: Only Marketed by
    pairs = [{"role": "marketed by", "entity": "Sales Corp"}]
    ev = _build_evidence("manufacturer_name", json.dumps(pairs))
    assert validate_manufacturer(ev, {}, dummy_rule).decision == Decision.REVIEW
    
    # Valid: Marketed by + Manufactured by
    pairs = [
        {"role": "marketed by", "entity": "Sales Corp"},
        {"role": "manufactured by", "entity": "Acme Corp"}
    ]
    ev = _build_evidence("manufacturer_name", json.dumps(pairs))
    assert validate_manufacturer(ev, {}, dummy_rule).decision == Decision.PASS

def test_validate_consumer_care(dummy_rule):
    ev = _build_evidence("consumer_care", "1800-123-456")
    assert validate_consumer_care(ev, {}, dummy_rule).decision == Decision.PASS
    
    ev_bare = _build_evidence("consumer_care", "UNVERIFIED_BARE_CONTACT:9999999999")
    assert validate_consumer_care(ev_bare, {}, dummy_rule).decision == Decision.REVIEW
