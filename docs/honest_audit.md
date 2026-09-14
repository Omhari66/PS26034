# Honest System Audit — PS 26034
### What the code *actually* does, point by point

---

> **Reading key**
> - ✅ **Correct** — code does what was claimed
> - ⚠️ **Partial** — code tries but with named limitations
> - ❌ **Wrong / Missing** — code does not do this
> - 🔴 **Dangerous** — wrong in a way that produces confidently bad outputs

---

## The one question you wanted answered first

> *"When the system sees `MRP ₹149`, what exactly happens before it outputs PASS?"*

Here is the exact code path, line by line:

```
1. EasyOCR reads the full image → list of (text, bbox, confidence)

2. field_extractor.py tries regex patterns on each OCR text block:
     Pattern 1: r"(?:MRP|M\.?R\.?P\.?)\s*[:()]*(?:Rs\.?|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)"
     Pattern 2: r"(?:Rs\.?|₹)\s*(\d[\d,]*(?:\.\d{1,2})?)"

   If either matches, raw = "149", unit = None
   normalize_mrp("149") → "149.00"

3. EasyOCREngine.recognize_region() crops the bbox (10px margin),
   scales it 2× with LANCZOS, re-runs the SAME EasyOCR model.
   This gives a slightly different pixel representation of the same text.

4. conflict.py: if |149.00 - 149.00| / 149.00 < 0.05 → not conflicting → FOUND

5. evaluate_field(evidence):
     evidence.state = FOUND
     evidence.ocr_confidence = 0.87  (for example)
     0.87 >= 0.6 → return Decision.PASS

6. Stored in DB. Report shows: MRP → PASS
```

**Your conclusion is correct.**
There is zero validation of whether "₹149" actually constitutes a legally compliant MRP declaration.
Detection = Compliance is the current behaviour.

---

## A. Core Legal Compliance Logic

### A1. FOUND does not mean COMPLIANT ❌ 🔴

**What the code does:**
```python
# compliance_engine.py line 131-133
return RuleResult(
    rule_id, rule_version, evidence.field_name, Decision.PASS,
    f"{evidence.field_name} present and consistent", evidence,
)
```

"Present and consistent" means: regex found it + confidence ≥ 0.6. Nothing else.

The code does not check:
- Is the MRP inclusive of all taxes? (Rule 6(1)(c) explicit requirement)
- Is the MRP printed in a size ≥ what the rule requires?
- Is it on the principal display panel?
- Is it the *correct* MRP (not a promotional/offer price)?

**Your diagnosis:** Confirmed. FOUND → PASS without legal validation.

---

### A2. Rule engine is not implementing the rule ❌ 🔴

**What the JSON does:**
```json
"legal_ref": "Rule 6(1)(c) — LM(PC) Rules 2011"
```

**What the code does with it:**
```python
# applicability.py → rule_id passed to evaluate_field
# evaluate_field uses rule_id only for the RuleResult label — not for logic
```

The rule_id is a label. The actual evaluation logic in `evaluate_field()` is identical
for every rule: `FOUND + conf ≥ 0.6 → PASS`. Rule 6(1)(a) and Rule 6(1)(c) produce
the exact same code path. The JSON reference is cosmetic metadata, not executable law.

---

## B. MRP Detection

### B3. MRP regex is too generic ⚠️ 🔴

**What the code actually has:**
```python
_MRP_PATTERNS = [
    # Pattern 1 — specific: requires "MRP" keyword
    r"(?:MRP|M\.?R\.?P\.?)\s*[:()]*(?:Rs\.?|₹)?\s*(\d[\d,]*(?:\.\d{1,2})?)",
    # Pattern 2 — generic: just "₹ number"
    r"(?:Rs\.?|₹)\s*(\d[\d,]*(?:\.\d{1,2})?)",
]
```

Pattern 1 is reasonable. Pattern 2 is a trap.

Pattern 2 will match `Discount: ₹50`, `Offer Price: ₹99`, `Save ₹30`.
The system picks the candidate with the **highest OCR confidence**, not the
highest semantic relevance. On a label with multiple ₹ values, it will
confidently pick the wrong one.

**Your diagnosis:** Confirmed. False positive risk is real.

### B4-B5. Cannot distinguish MRP from other monetary values ❌ 🔴

The code has no context window, no neighbouring-text analysis, no understanding
of `Offer Price` vs `MRP`. It sees tokens, not meaning.

---

## C. OCR Architecture

### C6. PaddleOCR is not active ✅ (you are right)

**From paddleocr_engine.py line 30-35:**
```python
def __init__(self) -> None:
    raise RuntimeError(
        "PaddleOCR is not available in this environment "
        "(paddlepaddle has no Python 3.14 wheel on Windows)."
    )
```

PaddleOCR raises `RuntimeError` on construction. It is dead code.

### C7. The cross-check mechanism is not what the docs claimed ⚠️

**What actually happens (inspection_service.py lines 307-314):**
```python
secondary = None
try:
    secondary = PaddleOCREngine()   # raises RuntimeError immediately
except RuntimeError:
    secondary = primary             # EasyOCREngine is used as both primary AND secondary
```

So the "cross-check" is:
- EasyOCR reads the full image
- EasyOCR reads a 2× zoomed crop of the same region

That is **not two independent models**. It is one model seeing the same text
twice at different resolutions. It is better than nothing (zoom can
reveal reading errors from distortion or blur), but it is not the
dual-model independence the architecture claimed.

**Practical implication:** If EasyOCR misreads `₹149` as `₹149` in both passes,
both agree → FOUND. If it misreads in the same way both times (which is common
for systematic OCR errors on certain fonts), the conflict detector won't catch it.

---

## D. NOT_FOUND Handling

### D8. NOT_FOUND → FAIL without coverage verification ❌ 🔴

**From compliance_engine.py lines 112-122:**
```python
if evidence.state == EvidenceState.NOT_FOUND:
    if not required:
        return RuleResult(..., Decision.NOT_APPLICABLE, ...)
    return RuleResult(
        rule_id, rule_version, evidence.field_name, Decision.FAIL,
        f"{evidence.field_name} required but not found with sufficient coverage",
        evidence,
    )
```

The reason string says "with sufficient coverage" — but this is aspirational text,
not code. The code does not check whether coverage was actually sufficient.
It checks `evidence.state == NOT_FOUND`, full stop.

The `coverage` dict (`{"front": True, "back": True, "close_up": False}`) is recorded
and displayed, but `evaluate_field()` does not receive it and does not use it.

**Concrete failure scenario:**
- Inspector photographs only the front panel (which happens to not have Consumer Care)
- Back panel has Consumer Care but was never photographed
- System: `Consumer Care → NOT_FOUND → FAIL`
- Reality: Consumer Care is present, inspector just didn't photograph it

---

## E. Image Coverage

### E9. Three photos ≠ complete coverage ⚠️

The roles (`front`, `back`, `close_up`) are **inspector-assigned**, not machine-verified.
The inspector labels the image `front` and the system trusts that label.

The `CoverageChecklist` component on the mobile app shows three named slots.
This is a workflow enforcement mechanism — it asks the inspector to deliberately
capture each panel. But it cannot verify the inspector actually captured the
correct physical panel vs. photographing the front three times with different labels.

**What the code does do:** records which roles were submitted and whether each
was accepted. Stores `coverage = {"front": True, "back": True, "close_up": False}`.

**What it doesn't do:** verify the content of each photo corresponds to the
physical panel the role claims.

### E10. Role assignment is manual ⚠️

The inspector explicitly taps "Capture Front", "Capture Back", "Capture Close-up".
The system names them accordingly. There is no computer-vision check to confirm
the captured image is actually a front panel.

---

## F. Placement Validation

### F11. Placement is not checked ❌

The bounding box is stored: `bbox = (x1, y1, x2, y2)` in original image coordinates.
This tells you *where in the photo* the text was found, not *where on the physical
label* it belongs.

The code has no concept of "principal display panel", no panel segmentation,
and no placement rules. The bbox is evidence metadata, not placement validation.

---

## G. Font Size

### G12-G13. Font size compliance is not implemented ❌

Not a single line of code addresses font size. OCR confidence is reported.
Font size in pixels is not computed. Physical font size (mm) is not possible
from a single uncalibrated phone photo without knowing camera distance,
focal length, and physical reference dimensions.

This is a hard open problem, not just a missing feature.

---

## H. Product Category

### H14. Wrong category → wrong rules ❌ 🔴 (inherited risk)

The applicability engine (`applicability.py`) correctly loads required fields
per category from the JSON. If the category is wrong, the rule set is wrong.
The system has no way to detect or correct a wrong category.

### H15. Category is manually selected ✅ (acknowledged in design)

The inspector selects from a predefined list. The system uses it directly.
No automatic classification is attempted. The code is honest about this.

---

## I. Five Fields

### I. The five fields are a deliberate MVP subset ✅ (honest in code)

The rule_table_v1.json explicitly scopes to five fields. The `_comment` in the
JSON says "Legal Metrology (Packaged Commodities) Rules 2011" — which is true
in the sense that these five fields *are* required by those rules. But the rules
require more than five things total. The code does not check country of origin,
best-before date, batch number, etc.

---

## J. Date Extraction

### J16. Date extraction is a best-effort regex ⚠️

The patterns cover a reasonable range of Indian FMCG date formats. However:

```python
_MFG_DATE_PATTERNS = [
    r"(?i)(?:mfg\.?\s*date?|manufactured\s*(?:on|date|:)|...)\s*[:=]?\s*(.{4,20})",
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
    r"\b(\d{1,2}[/-]\d{4})\b",
    r"\b((?:Jan|Feb|...)\.?\s+\d{4})\b",
]
```

The code extracts dates but does not:
- Distinguish "Mfg Date" from "Best Before" from "Expiry"  
- Validate the date is plausible (not in the future, not 30 years ago)
- Understand that "Best Before: Jan 2026" is NOT the manufacturing date

---

## K. Manufacturer Extraction

### K17. Manufacturer role disambiguation is partial ⚠️

The pattern:
```python
r"(?i)(?:manufactured\s+by|mfr\.?:|mfd\.?\s*by|marketed\s+by|packed\s+by|distributed\s+by)\s*[:\s]\s*(.{5,100})"
```

This does capture different entity roles. But it picks the first/highest-confidence
match. If a label says "Manufactured by A for B, Marketed by C", the extracted
value is the first match — the system doesn't understand the legal hierarchy
of entity types under LM(PC) Rules.

---

## L. Consumer Care

### L18. Phone/email detection without context ⚠️

```python
_CONSUMER_CARE_PATTERNS = [
    r"(?i)(?:consumer\s*(?:care|helpline|grievance)|...).*(.{5,60})",
    r"\b(\+?91[-\s]?\d{10})\b",     # any Indian mobile
    r"\b(1800[-\s]\d{3,4}[-\s]\d{4})\b",  # toll-free
    r"\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b",  # email
]
```

Pattern 1 looks for context keywords — reasonable.
Patterns 2-4 will match *any* phone number or email on the label, even if it's
the manufacturing plant's internal phone listed in the address block, not a
consumer helpline.

---

## M. Confidence Interpretation

### M19. OCR confidence ≠ compliance confidence ❌ 🔴

```python
# compliance_engine.py line 125
if evidence.ocr_confidence is not None and evidence.ocr_confidence < 0.6:
    return RuleResult(..., Decision.REVIEW, ...)
return RuleResult(..., Decision.PASS, ...)
```

The 0.6 threshold is arbitrary. There is no calibration data behind it.
OCR confidence varies by engine, font, lighting, and language.
A 0.65 confidence reading of a wrong value gets PASS.
A 0.55 confidence reading of a correct value gets REVIEW.

---

## N. LLM Boundaries

### N20. LLM constraints are correctly designed ✅

The code correctly enforces the AGENTS.md rule: `evaluate_field` and `aggregate_overall`
have zero LLM calls. The comment in `compliance_engine.py` explicitly states this.
The constraint is architectural, not just aspirational.

---

## O. Rule Database

### O21. Five rules ≠ complete LM(PC) Rules 2011 ✅ (accurately scoped in JSON)

The JSON has a `_comment` that says exactly what it covers. The `rule_version: "v1.0"`
and `effective_date: "2026-09-01"` are honest versioning. The coverage gap
(batch number, country of origin, best-before, etc.) is a known MVP limitation,
not a hidden one.

---

## P. Rule Applicability

### P22. `required = true/false` is too simple ⚠️

```python
# From applicability.py (via get_rules())
field_rule_lookup = {fr.field: fr for fr in category_rules.fields}
required = fr.required if fr else False
```

Required is a boolean. There are no conditional requirements in the current
engine (e.g. "required IF net quantity > 25g"). This is a known Phase 4+ gap.

---

## Q. Rule Updates

### Q23. Versioned JSON is necessary but not sufficient ✅ (design is right, process is missing)

The architecture is correct: `rule_version` is stamped on every report.
Old reports keep their original rule_version. New submissions use `CURRENT_RULE_VERSION`.
The versioning infrastructure is sound. The human process of reading amendments
and updating the JSON correctly is outside the software.

---

## R. Evidence Viewer

### R24. Bbox shows OCR location, not legal placement ⚠️

Confirmed in code. The bbox is stored and displayed. It is useful — it lets a
supervisor see exactly where on the image OCR found something. It does not
constitute placement validation per legal requirements.

---

## S. False PASS Risk

### S. Overall PASS from individually weak field PASSes ❌ 🔴

This is the most dangerous production failure mode.

```
MRP: regex matched "₹149" (may be offer price) → PASS
Net Qty: regex matched "500g" (ambiguous context) → PASS  
Mfg Date: regex matched "01/2025" (might be expiry date) → PASS
Manufacturer: regex matched company name → PASS
Consumer Care: email matched (might be a supplier contact) → PASS

aggregate_overall([PASS, PASS, PASS, PASS, PASS]) → OVERALL: PASS
```

A product can receive an overall green PASS with every individual decision
based on a regex match and a single OCR confidence number. No legal validation
of any field has been performed.

---

## T. System Cannot Certify Compliance ✅ (correctly NOT claimed)

The codebase does not contain the phrase "legally compliant" in any user-facing
output. The result is `PASS/FAIL/REVIEW`. The REVIEW state is first-class.
The evidence is shown. This is the correct epistemic posture.

---

## U-V. Dataset and Test Data

### U25-V27. No domain validation dataset exists ❌

There is a `tests/test_ocr/sample_images/README.md` but the README notes
these are placeholder/synthetic images. No real-world Indian FMCG label
validation corpus exists in the repository.

The accuracy metrics you would need to trust the system:
- Field extraction F1 per field (precision + recall)
- False PASS rate on known-non-compliant labels
- False FAIL rate on known-compliant labels

None of these are currently measured.

---

## W-X. Packaging Variation and Multilingual Support

### W28. Single product type tested ❌

No evidence of multi-SKU testing in the repository.

### X29. English-only OCR ❌ 🔴 (for Indian market)

```python
# easyocr_engine.py line 74
self._lang_list = lang_list or ["en"]
```

EasyOCR is initialized with `["en"]` only. Hindi and regional language text
on labels will not be recognized. For Indian FMCG labels where bilingual
declarations are common, this is a significant gap.

EasyOCR supports Hindi (`"hi"`) and many Indian scripts — it just isn't enabled.

---

## Y. Quality Gate

### Y30. Quality thresholds were not empirically calibrated ❌

Today (this session) I changed the quality gate from:
```python
accepted = quality in ("high", "medium")   # old
```
to:
```python
accepted = True   # current — everything accepted
```

This was necessary to make real phone photos pass. The original thresholds
(`_SHARP_LOW = 40.0`, `_BRIGHT_MIN = 35.0`) were rejecting valid phone photos,
blocking the entire pipeline. The correct fix is calibration with real photos,
not blanket acceptance. The `TODO(phase5)` comment documents this honestly.

---

## Z-AE. Other Points

| Point | Status | Code Reality |
|---|---|---|
| Z31. Capture workflow | ⚠️ Partial | Inspector must tap named slots; not enforced by CV |
| AA32. REVIEW rate | ❌ Not measured | No rate tracking in DB or dashboard |
| AB33. Automation bias | ⚠️ Design risk | Evidence is shown alongside decision — mitigates somewhat |
| AC34. Image authenticity | ❌ Not addressed | Expected for MVP |
| AD35. Product identity | ❌ Not addressed | No barcode/SKU linkage |
| AE36. Longitudinal analytics | ❌ Not implemented | List/filter in dashboard, no trend analysis |
| AF37. Risk-based prioritization | ❌ Not implemented | Correctly absent — no historical data |

---

## The Honest Summary Table

| Claim | Reality |
|---|---|
| Dual OCR cross-check | **Same engine, different zoom. Not dual-model.** |
| Rule engine implements LM(PC) Rules 2011 | **Rule IDs are labels. Logic is: found + conf ≥ 0.6 → PASS.** |
| NOT_FOUND + required → FAIL | **True. But coverage is not verified before firing FAIL.** |
| MRP extraction | **Works on explicit "MRP: ₹X". Pattern 2 matches any ₹ value.** |
| Field extraction by regex | **True and honest. Regex ≠ semantic understanding.** |
| Five mandated fields per LM(PC) Rules | **Correct fields. Not complete rule coverage.** |
| Evidence-backed report | **Evidence is stored and displayed. Not legally verified.** |
| Append-only audit trail | **Correctly implemented.** |
| Supervisor override | **Correctly implemented.** |
| Font size compliance | **Not implemented. Likely not feasible from phone photos alone.** |
| Placement validation | **Not implemented.** |
| Hindi/regional language OCR | **Not enabled.** |
| Quality gate calibrated | **Not calibrated. Currently accepting all images (changed today).** |

---

## The Five Most Dangerous Production Failure Modes

Ranked by "most likely to produce a confidently wrong PASS":

1. **MRP Pattern 2** (`₹ number`) matches offer prices → false PASS on MRP
2. **NOT_FOUND → FAIL** without coverage check → false FAIL when declaration is present but not photographed
3. **Single OCR engine** — systematic EasyOCR errors on certain fonts are undetectable
4. **English-only OCR** — Hindi declarations on labels produce NOT_FOUND → FAIL
5. **FOUND → PASS** without legal validation — any detected text produces a green PASS

---

## What would actually fix the top problems

This is not a plan, just honest mapping of problems to solutions:

| Problem | Real fix |
|---|---|
| FOUND → PASS | Add field-specific validators after extraction: MRP must be numeric, > 0, labelled as MRP not as offer price |
| Pattern 2 false positives | Remove bare `₹` pattern; require MRP keyword; if not found, mark NOT_FOUND rather than guessing |
| Coverage-gated FAIL | Pass coverage dict into evaluate_field; if NOT_FOUND + coverage incomplete → NOT_VERIFIABLE (not FAIL) |
| Single OCR engine | Enable EasyOCR with `["en", "hi"]`; add a rule-based second pass using a different preprocessing path |
| Hindi OCR | Change `lang_list or ["en"]` to `["en", "hi"]`; test on bilingual labels |
| Quality calibration | Collect 50-100 real phone photos, measure sharpness/brightness distribution, set empirical thresholds |
