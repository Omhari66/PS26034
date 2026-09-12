# Module Contracts — PS 26034

## System Contract (read this first)

> **A detected value is not automatically valid evidence, and valid evidence is
> not automatically proof of compliance. Every compliance decision must be
> supported by sufficient captured evidence, contextual field identification,
> applicable rule evaluation, and an explicit validation result. When evidence
> is insufficient or ambiguous, the system must return REVIEW rather than infer
> a conclusion.**

This one paragraph is the contract that every module, every developer, and every
AI agent operates under. Everything below is the per-module detail.

---

## Global rules (non-negotiable)

1. `EvidenceState` and `Decision` are defined **exactly once** in
   `packages/shared-schema/compliance_engine.py`. Import from there. Never redefine.

2. **REVIEW is a first-class outcome**, not a fallback for errors. Weak or
   conflicting evidence routes to REVIEW, never to a guessed PASS or FAIL.

3. **Reports are append-only.** Never edit or delete a generated inspection
   report. Corrections happen by creating a new report against a new `rule_version`.

4. **No evidence invented.** Every field value must trace back to an image +
   bbox + OCR confidence. If you can't point to the source, the value does not
   exist yet.

---

## 1. Capture & Quality
**Input:** raw images + declared image role (`front` / `back` / `close_up`)
**Output:** `{image_id, role, quality: high|medium|low, accepted: bool, coverage: dict}`
**MUST NOT:** run OCR, interpret content, make pass/fail decisions.

### Coverage rule
```
coverage = {"front": bool, "back": bool, "close_up": bool}
```
Front + Back must both be `true` before `NOT_FOUND → FAIL` is allowed.
If either is `false`, the correct outcome is `NOT_VERIFIABLE → REVIEW`.

---

## 2. OCR & Evidence Layer
**Input:** accepted images from stage 1
**Output:** `FieldEvidence` objects only — see `compliance_engine.py`
**MUST NOT:** decide FAIL/PASS, invent values, use primary engine as both
primary AND secondary (that is not a cross-check).

### Secondary engine rule
If the secondary engine is unavailable:
- Set `FieldEvidence.single_engine_only = True`
- Affected fields are capped at **REVIEW** — they cannot earn PASS
- This flag must be visible in the evidence panel as its own labeled field,
  not folded into "OCR agreement: 1/1"
- **Do not silently fall back to primary-twice and pretend it was verified**

### Language routing rule (enforced from Phase 0)
Any OCR result block where the detected script is not in the engine's supported
language list MUST be marked `EvidenceState.NOT_VERIFIABLE` with
`reason="unsupported_language"`.
- **It must NEVER become NOT_FOUND.** NOT_FOUND + full coverage + required = FAIL.
  Routing an unsupported language to NOT_FOUND silently fails every compliant
  non-English label.
- Adding a new language to the engine is a PHASES.md task.
  The routing rule for unsupported languages is a CONTRACTS.md requirement —
  it must exist before coverage expands, not after.

### OCR output contract
```json
{"engine": "easyocr", "text": "MRP ₹199", "bbox": [120, 240, 310, 285], "confidence": 0.94}
```
OCR output MUST NOT contain: PASS, FAIL, REVIEW, or any compliance verdict.

---

## 3. Semantic Extraction & Evidence Validation
**Input:** raw OCR text blocks + bboxes + coverage dict
**Output:** `FieldEvidence` with `state` set to
  `FOUND / NOT_FOUND / NOT_VERIFIABLE / CONFLICTING`
**MUST NOT:** silently pick one value when readings disagree — produce `CONFLICTING`.
**MUST NOT:** treat detection as identification (finding `₹199` ≠ finding `MRP`).

### Inspector-vs-AI reconciliation rule
When an inspector pre-enters a field value and AI extraction produces a different
value for the same field:
- Surface the disagreement explicitly: "You entered ₹180, AI detected ₹149 — confirm one"
- Require an explicit resolution choice (confirm AI / enter correction / mark absent)
  before submission
- Storing both values silently without surfacing the conflict is **not acceptable**

### Context-window rule
For MRP: build a ±3 block context window and score the candidate.
```
MRP keyword nearby          → +6
"Maximum Retail Price"      → +5
currency symbol alone       → +1
Offer/Sale/Discount nearby  → -6
```
Score ≥ threshold → MRP candidate. Ambiguous → REVIEW.

### Field-specific rules
| Field | MUST distinguish from |
|---|---|
| MRP | Offer price, sale price, discount amount |
| Mfg Date | Best Before date, Expiry date |
| Manufacturer | Marketer, Packer, Importer |
| Consumer Care | Sales line, plant phone, random numbers in address |
| Net Quantity | Serving size, pack count, nutritional weight |

---

## 4. Applicability Engine
**Input:** inspector-confirmed category + rule version
**Output:** `{field: {rule_id, required: bool}}` for that category
**MUST NOT:** infer category from OCR alone without inspector confirmation.
**MUST NOT:** return `required=True` for a field that is genuinely optional
  for the given category (e.g. Consumer Care for Drugs & Pharma).

---

## 5. Rule Engine & Field Validators
**Input:** `FieldEvidence` + `coverage: dict` + `rule_id` + `required: bool`
**Output:** `RuleResult` with `Decision` and `reason`
**MUST NOT:** call an LLM, call OCR, modify evidence, access the UI.
Must be a **pure function** — same input always produces same output.

### Dispatch rule (Gap 1)
`evaluate_field()` is a **router**, not a decision-maker. Each `rule_id` maps to
its own validator function. The dispatch table:
```python
_FIELD_VALIDATORS = {
    "LM-MRP-001": validate_mrp,
    "LM-NQ-001":  validate_quantity,
    "LM-MD-001":  validate_date,
    "LM-MN-001":  validate_manufacturer,
    "LM-CC-001":  validate_consumer_care,
}
```
Adding a new rule means adding a new function. It must never mean adding a new
JSON row consumed by identical logic.

### Sub-check granularity rule
Validators must return **which sub-check failed** in the `reason` field, not just
the overall decision. "MRP present but classified as offer price (context score: -3)"
is acceptable. "REVIEW" alone is not.

When a field has multiple legal requirements (e.g. MRP present AND MRP tax-inclusive),
each requirement must be separately expressible in the reason so a future multi-rule
field does not require a rewrite of the dispatch table.

### Calibration citation rule
Any numeric threshold in any validator (confidence cutoff, context score threshold,
quality gate) MUST include a code comment citing the calibration experiment that
produced it. No threshold ships as a guess.
Example:
```python
CONF_THRESHOLD = 0.60  # Phase 2.5 calibration run 2026-09-XX; false-PASS rate = 0
```

### Validator signatures
```python
def validate_mrp(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult
def validate_quantity(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult
def validate_date(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult
def validate_manufacturer(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult
def validate_consumer_care(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult
```

### validate_manufacturer() requirements
- Extract role + entity pairs: `{"role": "Manufactured by", "entity": "Amul GCMMF"}`
- When multiple entities appear under different roles, return ALL pairs (not first match)
- Compliance check: at least one entity with role `Manufactured by` OR `Packed by` MUST
  be present — the legal requirement is the *packer/manufacturer*, not any company name
- If only `Marketed by` or `Distributed by` entities are found → **REVIEW**
  (presence of a marketer does not satisfy the manufacturer requirement)

### validate_consumer_care() requirements
- Pattern 3 (bare `+91`/10-digit mobile) and Pattern 4 (bare email) MUST be gated:
  only match if a consumer-care context keyword appears within ±3 OCR blocks
- Context keywords: "consumer care", "customer care", "helpline", "grievance",
  "toll free", "call us"
- A phone number in the manufacturer address block is NOT a consumer helpline
- If context keyword absent and only bare phone/email found → state=FOUND but
  return REVIEW with reason "consumer care contact found but no context keyword"

### Decision rules
| Condition | Decision |
|---|---|
| FOUND + context confirmed + conf ≥ 0.6 + coverage ok | PASS |
| `single_engine_only=True` | REVIEW (capped — cannot earn PASS) |
| NOT_FOUND + coverage complete (front+back) + required | FAIL |
| NOT_FOUND + coverage incomplete | REVIEW |
| NOT_FOUND + not required | NOT_APPLICABLE |
| NOT_VERIFIABLE (incl. unsupported language) | REVIEW |
| CONFLICTING | REVIEW |
| FOUND + conf < 0.6 | REVIEW |
| Any unresolved ambiguity | REVIEW |

### `validate_mrp()` must check
1. Evidence state is FOUND
2. Candidate was scored as MRP (not offer/sale/discount)
3. Value is numeric and > 0
4. OCR confidence ≥ 0.6
5. Coverage is sufficient (or return REVIEW)

---

## 6. LLM Boundary (locked — applies everywhere)

### LLM MAY
- Explain an already-generated finding in plain language
- Suggest a product category (inspector must confirm)
- Normalize text when deterministic normalization fails
- Summarize inspection results for the dashboard

### LLM MUST NOT
- Create or modify a `FieldEvidence` object
- Set `EvidenceState` to any value
- Decide PASS, FAIL, or REVIEW
- Resolve conflicting evidence silently
- Invent values not present in OCR output
- Output anything that enters the rule engine pipeline

If an LLM is used in a module, its output must be:
- A classification label (`MRP / OFFER / SALE / UNKNOWN`) — not a compliance verdict
- Traceable to specific OCR result IDs it relied on
- Treated as a **suggestion** that feeds into deterministic scoring, not a final answer

---

## 7. Report & Audit Trail
**Input:** `InspectionReport`
**Output:** rendered report, append-only audit log entry
**MUST NOT:** edit or delete a past report. Corrections happen by generating
a new report against a new `rule_version`, referencing the old one.

### Report completeness guarantee
Report generation MUST raise an error (not silently render "Not available") if
a field with `state=FOUND` has no `extracted_value` in the rendered output.
- A blank field in the final report must mean the data was genuinely never
  captured — never a template or serialization bug
- Offer a live preview before final generation so gaps are caught while the
  inspector is still on-site, not after the fact
- Append-only: corrections require a new report, never an edit to this one

### Structured field-level correction schema
When a field is flagged REVIEW, the inspector or supervisor resolution MUST be
stored as structured data — not free-text:
```json
{
  "field_name": "mrp",
  "action": "corrected",
  "ai_value": "149.00",
  "corrected_value": "199.00",
  "reviewer_id": "insp_001",
  "acknowledged": true,
  "timestamp": "2026-09-12T11:30:00Z"
}
```
`action` must be one of: `"confirmed"` | `"corrected"` | `"marked_absent"`

Free-text remarks remain available for commentary but are NOT the mechanism
for resolving a flagged field. Decision quality tracking (Phase 9) depends on
querying this structured data.

### Per-field acknowledgment requirement
Each REVIEW field requires an explicit one-tap "I have manually verified this
value" before the inspection can be submitted. This acknowledgment is stored
as `acknowledged: true` in the structured correction schema above. It converts
a passive disclaimer into a queryable accountability signal.

### Supervisor override schema
Every supervisor override must store:
```
reviewer_id, reason, previous_decision, new_decision, timestamp
```

---

## Adversarial test contract (Phase 8)

Before any code in Phases 4–5 is considered complete, these must pass:

| Test | Input | Required output |
|---|---|---|
| 1 | `₹149` bare, no label | MRP: NOT_FOUND or REVIEW |
| 2 | `Offer ₹149` + `MRP ₹199` | MRP value = 199 |
| 3 | Consumer Care on back, only front captured | REVIEW (not FAIL) |
| 4 | Consumer Care blurry, conf=0.42 | REVIEW |
| 5 | Two OCR engines disagree on MRP value | CONFLICTING → REVIEW |
| 6 | `Mfg: 08/2026` + `BBD: 12 months` | Two separate evidence fields |
| 7 | Consumer care + sales number on same label | Only consumer-care contact extracted |
| 8 | Secondary OCR unavailable | REVIEW for affected fields |
| 9 | Hindi-only declaration | Processed or REVIEW, never silent FAIL |
| 10 | All fields FOUND at conf=0.45 | Overall REVIEW, not PASS |
