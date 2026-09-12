# Task: Implement `validate_mrp()`

**Who this is for:** The person implementing Phase 5 (Compliance Engine).
**File to create:** `apps/backend/app/services/validators/mrp.py`
**Estimated time:** 1 day
**Prerequisite:** Phase 4 (semantic extraction with context scoring) should be done first.

---

## The problem you are solving (read this carefully)

The system currently does this:

```
OCR finds any Rs./rupee amount on the label
           ↓
   state = FOUND
           ↓
      PASS  ← WRONG
```

You are replacing it with this:

```
OCR finds amount
           ↓
Phase 4 checks context (is this labelled "MRP"? or "Offer Price"?)
           ↓
validate_mrp() checks: is the evidence good enough to say the law is satisfied?
           ↓
   PASS / FAIL / REVIEW
```

---

## The function signature

```python
def validate_mrp(
    evidence: FieldEvidence,
    coverage: dict,
    rule: FieldRule,
) -> RuleResult:
```

### Arguments explained simply

| Argument | What it is | Example value |
|---|---|---|
| `evidence` | What OCR found about MRP | state=FOUND, value="199.00", confidence=0.87 |
| `coverage` | Which panels were photographed | `{"front": True, "back": False, "close_up": True}` |
| `rule` | The rule being applied | rule_id="LM-MRP-001", required=True |

---

## The 10 checks, in order

Stop at the first check that fails and return the result. Do not continue.

### Check 1 — Were there conflicting OCR readings?
```python
if evidence.state == EvidenceState.CONFLICTING:
    # Two engines saw different values (e.g. Rs.199 vs Rs.299)
    # Human must review
    return RuleResult(..., Decision.REVIEW, "Conflicting MRP readings: ...")
```

### Check 2 — Was it unverifiable?
```python
if evidence.state == EvidenceState.NOT_VERIFIABLE:
    # Image quality or coverage was too low to check
    return RuleResult(..., Decision.REVIEW, "Insufficient evidence to verify MRP")
```

### Check 3 — Was MRP not found?
```python
if evidence.state == EvidenceState.NOT_FOUND:
    front_ok = coverage.get("front", False)
    back_ok  = coverage.get("back", False)
    if front_ok and back_ok:
        # We checked both main panels — it is genuinely missing
        return RuleResult(..., Decision.FAIL, "MRP not found on any captured panel")
    else:
        # We haven't seen the full label — inspector might have missed the panel
        return RuleResult(..., Decision.REVIEW, "MRP not found but coverage incomplete — recapture needed")
```

### Check 4 — Is OCR confidence too low?
```python
if evidence.ocr_confidence is not None and evidence.ocr_confidence < 0.6:
    return RuleResult(..., Decision.REVIEW,
        f"MRP found but OCR confidence too low ({evidence.ocr_confidence:.2f})")
```

### Check 5 — Is the value a valid number?
```python
try:
    mrp_value = float(evidence.value or "")
except (ValueError, TypeError):
    return RuleResult(..., Decision.REVIEW, "MRP value could not be parsed as a number")
```

### Check 6 — Is the value greater than zero?
```python
if mrp_value <= 0:
    return RuleResult(..., Decision.FAIL, f"MRP value {mrp_value} is not a valid price")
```

### Check 7 — Was this actually classified as MRP (not offer/sale price)?
Phase 4 will store a `context_label` on the evidence. Check it.
```python
# Once Phase 4 adds context_label, do this:
context = getattr(evidence, "context_label", None)
if context is not None and context not in ("MRP", "UNKNOWN"):
    return RuleResult(..., Decision.REVIEW,
        f"Detected price was classified as '{context}', not MRP")
# If context_label doesn't exist yet, leave a TODO and skip this check.
```

### Check 8 — Was the front panel captured?
MRP should appear on the front panel. If we never saw the front, we cannot confirm.
```python
if not coverage.get("front", False):
    return RuleResult(..., Decision.REVIEW, "Front panel not captured; cannot confirm MRP placement")
```

### Check 9 — Is MRP required for this category?
```python
if not rule.required:
    return RuleResult(..., Decision.NOT_APPLICABLE, "MRP not required for this category")
```

### Check 10 — All checks passed
```python
return RuleResult(
    rule_id=rule.rule_id,
    rule_version=rule.rule_version,
    field_name="mrp",
    decision=Decision.PASS,
    reason=f"MRP declaration present: Rs.{mrp_value:.2f} with sufficient evidence.",
    evidence=evidence,
)
```

---

## How to build a RuleResult

```python
from packages.shared_schema import Decision, RuleResult

return RuleResult(
    rule_id=rule.rule_id,           # e.g. "LM-MRP-001"
    rule_version=rule.rule_version,  # e.g. "v1.0"
    field_name=evidence.field_name,  # "mrp"
    decision=Decision.REVIEW,        # or PASS, FAIL, NOT_APPLICABLE
    reason="Write a clear human-readable reason here.",
    evidence=evidence,
)
```

**Write clear reason strings.** The supervisor reads these. "REVIEW" with no reason
is not acceptable. "MRP found but confidence too low (0.42)" is acceptable.

---

## What you MUST NOT do

- Do not call an LLM to decide anything
- Do not invent a value if `evidence.value` is None
- Do not make database calls or network calls
- Do not redefine `Decision` or `EvidenceState` — import them
- Do not return PASS when any check above failed

This function must be **pure**: same input → same output, always.

---

## File structure

Create these files:
```
apps/backend/app/services/validators/
├── __init__.py     ← empty is fine
└── mrp.py          ← your file
```

Your file exports one function:
```python
def validate_mrp(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult:
    ...
```

---

## How to test your work

Run the existing adversarial tests:
```bash
cd apps/backend
uv run pytest tests/adversarial/test_ps26034_failures.py -v -k "test_01 or test_03 or test_04 or test_05 or test_10"
```

Tests 1, 3, 4, 5, and 10 should all pass once your validator is wired in.

Also write your own unit tests in:
```
apps/backend/tests/test_validators/test_mrp_validator.py
```

Write at least one test for each of the 10 checks. Tests must initially PASS for
correct behaviour and FAIL if you remove the check.

---

## Expected decisions — quick reference

| Situation | Decision | Why |
|---|---|---|
| CONFLICTING | REVIEW | Two engines disagreed |
| NOT_VERIFIABLE | REVIEW | Couldn't check |
| NOT_FOUND + front+back captured | FAIL | Checked everywhere, not there |
| NOT_FOUND + only front captured | REVIEW | Didn't see full label |
| FOUND + confidence 0.42 | REVIEW | Too uncertain |
| FOUND + value = "abc" | REVIEW | Not a valid price |
| FOUND + value = "0.00" | FAIL | Price is zero |
| FOUND + value = "199.00" + conf 0.87 | PASS | Everything OK |
| MRP not required for category | NOT_APPLICABLE | Category exemption |

---

## Definition of done

- [ ] `apps/backend/app/services/validators/mrp.py` exists and imports cleanly
- [ ] All 10 checks from this document are implemented
- [ ] Tests 1, 3, 4, 5, 10 in `test_ps26034_failures.py` pass
- [ ] At least 10 unit tests written for `validate_mrp()` directly
- [ ] Function has a docstring
- [ ] No LLM, no network, no DB calls inside the function
- [ ] Code reviewed by lead before merging
