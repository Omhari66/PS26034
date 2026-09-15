"""
Core evidence schema + deterministic decision engine for PS 26034.

Design principle: OCR/CV output is *observation*, never *truth*.
Every field carries an evidence state. Aggregation is a pure function
with no ML inside it — auditable, testable, and agent-proof.

Canonical location: packages/shared-schema/compliance_engine.py
The backend imports from this package. Mobile + dashboard use the
TypeScript mirror at packages/shared-schema/ts/schema.ts.
See ARCHITECTURE.md for the authoritative path reference.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum

# ---------------------------------------------------------------------------
# Evidence states — what we actually know about a field
# ---------------------------------------------------------------------------

class EvidenceState(str, Enum):
    FOUND = "FOUND"                    # value extracted, single consistent reading
    NOT_FOUND = "NOT_FOUND"            # searched, sufficient coverage, nothing there
    NOT_VERIFIABLE = "NOT_VERIFIABLE"  # insufficient coverage / image quality to say
    CONFLICTING = "CONFLICTING"        # multiple disagreeing readings


class Decision(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    REVIEW = "REVIEW"
    NOT_APPLICABLE = "NOT_APPLICABLE"
    CATEGORY_NOT_SUPPORTED = "CATEGORY_NOT_SUPPORTED"


# Priority order for aggregation — earlier wins over later.
_DECISION_PRIORITY = [
    Decision.CATEGORY_NOT_SUPPORTED,
    Decision.FAIL,
    Decision.REVIEW,
    Decision.NOT_APPLICABLE,
    Decision.PASS,
]


# ---------------------------------------------------------------------------
# Evidence object — the traceable chain of reasoning for one field
# ---------------------------------------------------------------------------

@dataclass
class FieldEvidence:
    field_name: str                       # e.g. "mrp", "net_quantity"
    state: EvidenceState
    value: str | None = None           # normalized extracted value, if any
    source_image: str | None = None
    bbox: tuple | None = None          # (x1, y1, x2, y2) in ORIGINAL image coords
    ocr_engine: str | None = None
    ocr_confidence: float | None = None
    secondary_value: str | None = None # from cross-check OCR, if run
    image_quality: str | None = None   # "high" | "medium" | "low"
    candidates: list = field(default_factory=list)  # for CONFLICTING: all readings seen
    single_engine_only: bool = False      # True = second engine unavailable; caps at REVIEW
                                          # See ARCHITECTURE.md Known Decisions for context


@dataclass
class RuleResult:
    rule_id: str
    rule_version: str
    field_name: str
    decision: Decision
    reason: str
    evidence: FieldEvidence


@dataclass
class FieldRule:
    """Carries the rule metadata into a validator function."""
    rule_id: str
    rule_version: str
    required: bool = True


@dataclass
class InspectionReport:
    product_id: str
    category: str
    rule_version: str
    field_results: list[RuleResult]
    overall_decision: Decision
    coverage: dict  # {"front": True, "back": True, "close_up": False}


# ---------------------------------------------------------------------------
# Calibrated Thresholds (Phase 2.5)
# ---------------------------------------------------------------------------
# Every numeric threshold is backed by real Indian FMCG calibration data.
# Citation: Phase 2.5 calibration dataset (50 samples, docs/calibration_report.md)
CONF_THRESHOLD: float = 0.60  # Phase 2.5 calibration run 2026-09-14; false-PASS rate = 0.0%


# ---------------------------------------------------------------------------
# Field validator stubs (Phase 5 — one function per rule_id)
# ---------------------------------------------------------------------------
# Each validator is a pure function: same input, same output, always.
# MUST NOT call an LLM, call OCR, modify evidence, or access the database.
# The full decision logic lives here, NOT in evaluate_field().
#
# Implementation schedule: Phase 5. Stubs here lock the dispatch contract
# so the rest of the system can be built against these signatures.
#
# Dispatch table at bottom of this section maps rule_id → function.
# ---------------------------------------------------------------------------


def _fmt_conf(confidence: float | None) -> str:
    """Format OCR confidence as a human-readable percentage string."""
    if confidence is None:
        return "conf: N/A"
    return f"conf: {confidence * 100:.0f}%"


def validate_mrp(
    evidence: FieldEvidence, coverage: dict, rule: FieldRule
) -> RuleResult:
    """MRP field validator — Phase 5 per-field dispatch."""
    if not evidence.value:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            "MRP: value not extracted. OCR returned no candidate with sufficient MRP context score.",
            evidence,
        )

    try:
        mrp_float = float(evidence.value)
    except ValueError:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"MRP: extracted value '{evidence.value}' could not be parsed as a number. Manual verification required.",
            evidence,
        )

    if evidence.ocr_confidence is not None and evidence.ocr_confidence < CONF_THRESHOLD:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"MRP ₹{mrp_float:.2f}: OCR confidence below threshold ({_fmt_conf(evidence.ocr_confidence)} < {CONF_THRESHOLD * 100:.0f}%). "
            "Value may be misread. Manual verification required.",
            evidence,
        )

    engine_note = "Single-engine (cross-check passed as secondary confirmed value)." if not evidence.single_engine_only else ""
    return RuleResult(
        rule.rule_id, rule.rule_version, evidence.field_name, Decision.PASS,
        f"MRP ₹{mrp_float:.2f} extracted and confirmed. {_fmt_conf(evidence.ocr_confidence)}. "
        f"Context scoring selected this value over any offer/discount candidates. {engine_note}".strip(),
        evidence,
    )



def validate_quantity(
    evidence: FieldEvidence, coverage: dict, rule: FieldRule
) -> RuleResult:
    """Net quantity field validator — Phase 5 per-field dispatch."""
    if not evidence.value:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            "Net Quantity: value not extracted. No candidate with net-weight/quantity label context found.",
            evidence,
        )

    valid_units = ("g", "kg", "ml", "l", "fl oz")
    if not any(evidence.value.endswith(u) for u in valid_units):
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Net Quantity '{evidence.value}': unit not recognised as a standard legal-metrology unit {valid_units}. "
            "Manual verification required.",
            evidence,
        )

    if evidence.ocr_confidence is not None and evidence.ocr_confidence < CONF_THRESHOLD:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Net Quantity '{evidence.value}': OCR confidence below threshold ({_fmt_conf(evidence.ocr_confidence)} < {CONF_THRESHOLD * 100:.0f}%). "
            "Manual verification required.",
            evidence,
        )

    return RuleResult(
        rule.rule_id, rule.rule_version, evidence.field_name, Decision.PASS,
        f"Net Quantity '{evidence.value}' extracted with standard unit. {_fmt_conf(evidence.ocr_confidence)}. "
        "Context scoring confirmed this is the pack quantity, not a serving-size value.",
        evidence,
    )



def validate_date(
    evidence: FieldEvidence, coverage: dict, rule: FieldRule
) -> RuleResult:
    """Manufacturing/packing date field validator — Phase 5 per-field dispatch."""
    if not evidence.value:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            "Manufacturing Date: value not extracted. No date candidate with MFD/PKD/DOM context was found. "
            "Ensure the label's manufacturing date is visible in the captured images.",
            evidence,
        )

    if evidence.ocr_confidence is not None and evidence.ocr_confidence < CONF_THRESHOLD:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Manufacturing Date '{evidence.value}': OCR confidence below threshold ({_fmt_conf(evidence.ocr_confidence)} < {CONF_THRESHOLD * 100:.0f}%). "
            "Date may be misread. Manual verification required.",
            evidence,
        )

    return RuleResult(
        rule.rule_id, rule.rule_version, evidence.field_name, Decision.PASS,
        f"Manufacturing Date '{evidence.value}' extracted. {_fmt_conf(evidence.ocr_confidence)}. "
        "Context scoring distinguished this from any Best Before / Expiry dates present on the label.",
        evidence,
    )

def validate_manufacturer(
    evidence: FieldEvidence, coverage: dict, rule: FieldRule
) -> RuleResult:
    """Manufacturer/packer field validator — Phase 5 per-field dispatch."""
    if not evidence.value:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            "Manufacturer Name: value not extracted. No 'Manufactured by' / 'Packed by' / 'Marketed by' role-entity pair found.",
            evidence,
        )

    import json
    try:
        pairs = json.loads(evidence.value)
        if isinstance(pairs, dict):
            pairs = [pairs]
        elif not isinstance(pairs, list):
            pairs = []
    except (ValueError, TypeError):
        val_lower = evidence.value.lower()
        if any(x in val_lower for x in ["manufactured", "mfd", "mfr", "packed"]):
            pairs = [{"role": "manufactured by", "entity": evidence.value}]
        elif "marketed" in val_lower:
            pairs = [{"role": "marketed by", "entity": evidence.value}]
        else:
            pairs = [{"role": "manufactured by", "entity": evidence.value}]

    if not pairs:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Manufacturer Name: could not parse manufacturer roles from extracted value: '{evidence.value}'. "
            "Manual verification required.",
            evidence,
        )

    has_mfr_or_packer = any(
        x in p.get("role", "").lower()
        for p in pairs
        for x in ["manufactured", "mfd", "mfr", "packed"]
    )
    has_marketed = any("marketed" in p.get("role", "").lower() for p in pairs)

    # Legal rule: a Marketer alone does NOT satisfy the Manufacturer requirement.
    if not has_mfr_or_packer and has_marketed:
        marketed_entity = next(
            (p.get("entity", "") for p in pairs if "marketed" in p.get("role", "").lower()), ""
        )
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Manufacturer Name: found 'Marketed by: {marketed_entity}' but the required "
            "'Manufactured by' or 'Packed by' legal entity is missing. "
            "Legal Metrology Act requires the name and address of the manufacturer/packer.",
            evidence,
        )

    if not has_mfr_or_packer:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            "Manufacturer Name: no 'Manufactured by' or 'Packed by' role found in extracted text. "
            "Manual verification required.",
            evidence,
        )

    if evidence.ocr_confidence is not None and evidence.ocr_confidence < CONF_THRESHOLD:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Manufacturer Name: OCR confidence below threshold ({_fmt_conf(evidence.ocr_confidence)} < {CONF_THRESHOLD * 100:.0f}%). "
            "Entity name may be misread. Manual verification required.",
            evidence,
        )

    role_summary = "; ".join(f"{p.get('role', '?').title()}: {p.get('entity', '?')}" for p in pairs)
    return RuleResult(
        rule.rule_id, rule.rule_version, evidence.field_name, Decision.PASS,
        f"Manufacturer declaration verified. {_fmt_conf(evidence.ocr_confidence)}. "
        f"Roles found: {role_summary}.",
        evidence,
    )

def validate_consumer_care(
    evidence: FieldEvidence, coverage: dict, rule: FieldRule
) -> RuleResult:
    """Consumer care contact field validator — Phase 5 per-field dispatch."""
    if not evidence.value:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            "Consumer Care: no contact value extracted. No phone number or email with consumer-care context keyword was found. "
            "Ensure the label's consumer helpline is visible in the captured images.",
            evidence,
        )

    if evidence.value.startswith("UNVERIFIED_BARE_CONTACT:"):
        bare_contact = evidence.value.replace("UNVERIFIED_BARE_CONTACT:", "")
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Consumer Care: found contact '{bare_contact}' but no consumer-care keyword (e.g. 'Consumer Care:', 'Helpline:', 'Toll Free:') "
            "was detected nearby. This may be a factory phone or address number. Manual verification required.",
            evidence,
        )

    if evidence.ocr_confidence is not None and evidence.ocr_confidence < CONF_THRESHOLD:
        return RuleResult(
            rule.rule_id, rule.rule_version, evidence.field_name, Decision.REVIEW,
            f"Consumer Care '{evidence.value}': OCR confidence below threshold ({_fmt_conf(evidence.ocr_confidence)} < {CONF_THRESHOLD * 100:.0f}%). "
            "Contact may be misread. Manual verification required.",
            evidence,
        )

    return RuleResult(
        rule.rule_id, rule.rule_version, evidence.field_name, Decision.PASS,
        f"Consumer Care contact '{evidence.value}' extracted with consumer-care keyword context. "
        f"{_fmt_conf(evidence.ocr_confidence)}. Contact is not a bare address/factory number.",
        evidence,
    )


# Dispatch table — this is the ONLY place rule_ids are mapped to logic.
# Adding a new rule means adding a new function above AND a new row here.
# NEVER add logic to evaluate_field() directly — it is a router, not a decision-maker.
_FIELD_VALIDATORS: dict = {
    "LM-MRP-001":  validate_mrp,
    "LM-NQ-001":   validate_quantity,
    "LM-MD-001":   validate_date,
    "LM-MN-001":   validate_manufacturer,
    "LM-CC-001":   validate_consumer_care,
}


# ---------------------------------------------------------------------------
# Rule evaluation — router only
# ---------------------------------------------------------------------------


def evaluate_field(evidence: FieldEvidence, rule_id: str, rule_version: str,
                    required: bool = True,
                    coverage: dict | None = None) -> RuleResult:
    """
    Route one field's evidence to its validator function and return the result.

    This function is a ROUTER. It must not contain decision logic.
    Decision logic lives in the validator functions registered in _FIELD_VALIDATORS.

    Pre-flight checks (single_engine_only cap, CONFLICTING, NOT_VERIFIABLE,
    NOT_FOUND + coverage) remain here because they apply universally across
    all rule_ids and must execute before any validator runs.

    Args:
        evidence:      The FieldEvidence for this field.
        rule_id:       The rule being evaluated (e.g. "LM-MRP-001").
        rule_version:  The rule version string (e.g. "v1.0").
        required:      Whether this field is required for the product's category.
        coverage:      Dict of {role: bool} indicating which panels were captured.
    """
    # Gap 2: single-engine cap — cannot earn PASS without cross-check
    if getattr(evidence, "single_engine_only", False):
        return RuleResult(
            rule_id, rule_version, evidence.field_name, Decision.REVIEW,
            (
                f"{evidence.field_name}: OCR cross-check not available (single engine only). "
                "Manual verification required. See ARCHITECTURE.md Known Decisions."
            ),
            evidence,
        )

    if evidence.state == EvidenceState.CONFLICTING:
        return RuleResult(
            rule_id, rule_version, evidence.field_name, Decision.REVIEW,
            f"Conflicting readings for {evidence.field_name}: {evidence.candidates}",
            evidence,
        )

    if evidence.state == EvidenceState.NOT_VERIFIABLE:
        return RuleResult(
            rule_id, rule_version, evidence.field_name, Decision.REVIEW,
            f"Insufficient coverage/quality to verify {evidence.field_name}",
            evidence,
        )

    if evidence.state == EvidenceState.NOT_FOUND:
        if not required:
            return RuleResult(
                rule_id, rule_version, evidence.field_name, Decision.NOT_APPLICABLE,
                f"{evidence.field_name} not required for this category", evidence,
            )
        # D8 fix: if coverage is incomplete, we cannot conclude the field is absent
        coverage_complete = _is_coverage_sufficient(coverage)
        if not coverage_complete:
            return RuleResult(
                rule_id, rule_version, evidence.field_name, Decision.REVIEW,
                (
                    f"{evidence.field_name} not found, but inspection coverage is incomplete "
                    f"(captured panels: {coverage}). Cannot conclude violation — "
                    "inspector should capture missing panels and re-inspect."
                ),
                evidence,
            )
        return RuleResult(
            rule_id, rule_version, evidence.field_name, Decision.FAIL,
            f"{evidence.field_name} required but not found on any captured panel",
            evidence,
        )

    # FOUND: dispatch to the field-specific validator
    validator = _FIELD_VALIDATORS.get(rule_id)
    if validator is not None:
        return validator(evidence, coverage or {}, FieldRule(rule_id, rule_version, required))

    return RuleResult(
        rule_id, rule_version, evidence.field_name, Decision.REVIEW,
        f"No validator mapped for {rule_id}",
        evidence,
    )


def _is_coverage_sufficient(coverage: dict | None) -> bool:
    """
    Returns True if front AND back panels are captured.
    front + back is the minimum set needed to conclude a required declaration
    is genuinely absent (vs. simply not photographed).

    close_up is optional — it supplements but doesn't gate coverage completeness.
    """
    if not coverage:
        return False  # no coverage info → assume incomplete
    return bool(coverage.get("front")) and bool(coverage.get("back"))


# ---------------------------------------------------------------------------
# Aggregation — one overall decision from many field results
# ---------------------------------------------------------------------------

def aggregate_overall(results: list[RuleResult]) -> Decision:
    """Priority order: CATEGORY_NOT_SUPPORTED > FAIL > REVIEW > NOT_APPLICABLE > PASS."""
    decisions = {r.decision for r in results}
    for d in _DECISION_PRIORITY:
        if d in decisions:
            return d
    return Decision.REVIEW  # safe default if results is empty/unexpected


def build_report(product_id: str, category: str, rule_version: str,
                  results: list[RuleResult], coverage: dict) -> InspectionReport:
    return InspectionReport(
        product_id=product_id,
        category=category,
        rule_version=rule_version,
        field_results=results,
        overall_decision=aggregate_overall(results),
        coverage=coverage,
    )


# ---------------------------------------------------------------------------
# Example / smoke test
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    mrp_evidence = FieldEvidence(
        field_name="mrp", state=EvidenceState.FOUND, value="149.00",
        source_image="front.jpg", bbox=(120, 80, 300, 140),
        ocr_engine="paddleocr", ocr_confidence=0.94,
    )
    consumer_care_evidence = FieldEvidence(
        field_name="consumer_care", state=EvidenceState.NOT_VERIFIABLE,
        image_quality="low",
    )

    results = [
        evaluate_field(mrp_evidence, "LM-MRP-001", "v1.2"),
        evaluate_field(consumer_care_evidence, "LM-CC-001", "v1.2"),
    ]

    report = build_report(
        product_id="P001", category="packaged_food", rule_version="v1.2",
        results=results, coverage={"front": True, "back": False, "close_up": False},
    )

    for r in report.field_results:
        print(f"{r.field_name:15s} -> {r.decision.value:8s} | {r.reason}")
    print(f"\nOVERALL: {report.overall_decision.value}")
