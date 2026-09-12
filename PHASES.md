# PHASES.md

Build one phase at a time. At the end of each phase: run all existing tests,
summarize what was built, list anything that is stubbed, and **stop** —
wait for explicit go-ahead before starting the next phase, even when the next
step seems obvious.

The rule is simple: **finish and verify before you continue.**

---

## Phase 0 — Foundation & Contracts
**Owner:** Lead (you)
**Goal:** A repo that runs with nothing fake inside it, and a contract every
developer can read before touching a file.

**Status: ✅ Complete**

---

## Phase 1 — Legal Rules & Applicability Engine
**Owner:** Member 5 (Legal Metrology)
**Goal:** The rule database and applicability engine are live and tested
**before** any OCR or mobile work touches them.

### Tasks
- Versioned JSON rule table for the 5 MVP declarations
- Applicability engine: `category + rule_version → {field: required}` mapping
- `GET /rules/{category}` endpoint
- Rule regression tests: 5 fields × 5 evidence states = 25 test cases
- `rule_version` stamped on every report; old reports keep their version

### Definition of done
All 25 rule regression tests pass. Old reports reference the old version.

**Status: ✅ Complete (v1.0 rules; coverage-gated NOT_FOUND fix applied)**

---

## Phase 2 — Capture, Quality & Coverage Gate
**Owner:** Member 2 (Mobile)
**Goal:** Inspector captures images with enforced roles; backend records
coverage and uses it to distinguish a missing field from an un-photographed panel.

### Tasks
- Camera capture flow: **Front → Back → Close-up** (named slots, enforced order)
- Quality scorer: blur / brightness / resolution → `high | medium | low`
- Coverage recorded: `{"front": bool, "back": bool, "close_up": bool}`
- Coverage passed to `evaluate_field()` — NOT_FOUND + incomplete → REVIEW (not FAIL)

### Coverage rule (critical)
```
NOT_FOUND + front AND back captured  → FAIL
NOT_FOUND + front OR back missing    → REVIEW
```

### Definition of done
- Quality scorer tested against 20 real phone photos
- Adversarial Test 3 passes: Consumer Care on back, only front captured → REVIEW

**Status: ✅ Partially complete — coverage-in-evaluate_field now wired**

---

## Phase 3 — OCR &amp; Multilingual Evidence
**Owner:** Member 3 (OCR)
**Goal:** Accepted images produce raw OCR output in English + Hindi.
Two genuinely different representations per critical field.

### Tasks
- Primary OCR engine (EasyOCR with `["en", "hi"]` — Hindi enabled)
- Secondary cross-check: **Tesseract** (independent architecture, not same-engine zoom)
  — see ARCHITECTURE.md Known Decisions for why Tesseract was chosen over PaddleOCR
- If secondary unavailable: set `single_engine_only=True` on affected FieldEvidence
  objects; those fields are capped at REVIEW. **Do not silently use primary twice.**
- Bounding box coordinate mapping
- Conflict detection: two readings differ → `CONFLICTING`
- **Duplicate-capture protection (Gap 12 — mobile, this phase):**
  When inspector assigns a role to a newly captured image, compare it against
  previously captured images in the same session using a perceptual hash (pHash).
  If similarity > 0.95 to an image already assigned a different role, warn and
  require a retake before allowing submission. Does not require panel classification.

### OCR output contract
```json
{"engine": "easyocr", "text": "MRP ₹199", "bbox": [120, 240, 310, 285], "confidence": 0.94}
```
OCR MUST NOT output: PASS, FAIL, or any compliance verdict.

### Definition of done
- Hindi labels tested on 5 real bilingual packages
- Adversarial Test 5 passes: OCR1=₹199, OCR2=₹299 → CONFLICTING → REVIEW
- Adversarial Test 8 passes: secondary unavailable → REVIEW (not fake dual-OCR PASS)
- Duplicate-capture warning fires when front panel photographed twice under different roles

**Status: ⚠️ Partial — English only, Hindi not enabled, Tesseract not yet wired as secondary**

---

## Phase 2.5 — Calibration Dataset
**Owner:** Member 3 + Member 5
**Slot:** After Phase 3 (OCR layer done), BEFORE Phase 5 (dashboard/validators).
**Goal:** Every numeric threshold in the system is backed by real data, not a guess.

### Why this phase exists
Phase 3 introduces thresholds (0.6 confidence cutoff, context score cutoffs, quality
gates). If these are guesses and the demo runs on them, we are presenting uncalibrated
numbers as if they were engineering decisions. This phase produces the evidence.

### Tasks
- Collect 50–100 real Indian FMCG label images (multiple brands, categories,
  lighting conditions)
- Manual annotation: ground truth recorded by a human who does NOT look at AI output first
- Per-field metrics: extraction precision, recall, false-PASS rate, false-FAIL rate
- At least one deliberately ambiguous case per field type:
  - MRP: label with both MRP and offer/sale price printed
  - Mfg date: label with both mfg date and best-before date
  - Consumer care: label with consumer care + factory phone in address block
  - Manufacturer: label with both Manufactured by and Marketed by entities
- "Adversarial testing" explicitly covered: multiple currency values, regional-language-only
  declarations, blurry/glare-heavy photos, labels with a field genuinely absent
- Each threshold updated with a calibration citation comment in code:
  ```python
  CONF_THRESHOLD = 0.60  # Phase 2.5 calibration run YYYY-MM-DD; false-PASS rate = 0
  ```

### Definition of done
- Dataset of ≥50 annotated images committed to `data/calibration/` (not in git — in
  object storage; path recorded in README)
- Calibration report in `docs/calibration_report.md`:
  per-field precision/recall, false-PASS rate, false-FAIL rate, REVIEW rate
- All thresholds in the codebase have calibration citation comments
- No threshold ships as a guess after this phase is done

**Status: ❌ Not started**

---

## Phase 4 — Semantic Extraction & Evidence Validation
**Owner:** Member 4 + Member 3
**Goal:** Raw OCR tokens become typed, contextual field evidence.
Detection ≠ Identification. Finding "₹199" ≠ finding "MRP".

### MRP candidate pipeline
```
Find all monetary candidates in OCR output
  ↓
Build context window (±3 OCR blocks)
  ↓
Score each candidate:
  MRP keyword nearby          → +6
  "Maximum Retail Price"      → +5
  currency symbol alone       → +1
  Offer/Sale/Discount nearby  → -6
  ↓
score ≥ threshold → MRP candidate
ambiguous score   → REVIEW
```

### Other fields
- **Date:** distinguish MFD/PKD from BBD/Expiry. Store semantic role.
- **Manufacturer:** preserve Manufactured by / Marketed by / Packed by / Imported by.
- **Consumer Care:** require proximity to a consumer-care keyword. Bare phone ≠ Consumer Care.
- **Net Quantity:** distinguish from serving size and pack count.

### Definition of done
Adversarial Tests 1, 2, 6, 7 all pass. MRP precision ≥ 80% on validation dataset.

**Status: ❌ Not implemented — current system has regex with no context window or scoring**

---

## Phase 5 — Compliance Engine &amp; Field Validators
**Owner:** Member 5 + Member 4
**Goal:** Evidence → legally-grounded decision. Not "found → pass."

### Key architectural rule (Gap 1)
`evaluate_field()` is a **router only**. Each `rule_id` dispatches to its own
validator. The dispatch table is the contract — see CONTRACTS.md §5.

### Validator signatures
```python
def validate_mrp(evidence: FieldEvidence, coverage: dict, rule: FieldRule) -> RuleResult
def validate_quantity(evidence, coverage, rule) -> RuleResult
def validate_date(evidence, coverage, rule) -> RuleResult
def validate_manufacturer(evidence, coverage, rule) -> RuleResult
def validate_consumer_care(evidence, coverage, rule) -> RuleResult
```

### PASS only when
- Evidence state is FOUND
- Candidate positively classified as the correct field (not offer/serving/etc.)
- Value is semantically valid
- Coverage was sufficient
- OCR confidence ≥ 0.6 (cite calibration run in comment)
- `single_engine_only` is False

### NOT_FOUND → FAIL only when
- Coverage complete (front + back captured)
- Field is required for the category

### LLM boundary (locked)
LLM MAY: explain findings, suggest category, summarize results.
LLM MUST NOT: create evidence, set state, decide PASS/FAIL/REVIEW, invent values.

### Definition of done
All 10 adversarial tests pass. Zero false PASSes on adversarial dataset.

**Status: ❌ Not implemented — current system uses FOUND + conf ≥ 0.6 → PASS for all fields**

---

## Phase 3.5 — Evidence Reconciliation &amp; Correction UX
**Owner:** Member 2 (Mobile) + Member 1 (Backend)
**Slot:** After Phase 3 (capture working), BEFORE Phase 7 (dashboard integration).
**Goal:** The mobile inspection flow has an explicit correction path for REVIEW fields,
an inspector-vs-AI reconciliation step, and a category sanity check.

### This phase is NOT demo polish
Phase 10 (SIH Demo Hardening) seeds data and rehearses flow.
This phase builds features the inspection flow requires to be correct.

### Tasks

**Gap 8 — Inspector-vs-AI reconciliation:**
- After OCR completes, auto-diff pre-entered inspector values vs. AI-extracted values
- Show only disagreements: "You entered MRP ₹180, AI detected ₹149 — confirm one"
- Inspector resolves each disagreement explicitly (confirm AI / enter correction / mark absent)
- This is a stronger cross-check than dual-OCR when secondary engine is unavailable

**Gap 9 — Structured field-level correction:**
- When a field is REVIEW, inspector sees three explicit options for that field:
  1. Confirm AI value
  2. Enter corrected value (typed structured field, not free text)
  3. Mark genuinely absent
- Each choice stored as structured data per CONTRACTS.md §7 schema
- Free-text remarks remain available for general commentary only

**Gap 10 — Per-field acknowledgment:**
- Each REVIEW field requires one-tap "I have manually verified this value"
  before the inspection can be submitted
- Stored as `acknowledged: true` in the structured correction record
- Inspector cannot submit an inspection with unacknowledged REVIEW fields

**Gap 7 — Category sanity soft warning:**
- After OCR completes, compare dominant commodity keywords from OCR text
  vs. a static keyword vocabulary for the selected category
- If mismatch detected (e.g. "Chocolate" under category "Cosmetics") → soft warning
  before submission: "Category mismatch detected — please verify your category selection"
- Not a block, not an auto-correct. Inspector’s confirmed category is authoritative.
- Implementation: static keyword list per category (no ML required)

### Definition of done
- Inspector-vs-AI diff surfaces all field disagreements before submission
- Structured correction records are stored and queryable
- Unacknowledged REVIEW fields block submission
- Category mismatch warning fires when commodity name doesn’t match selected category
- Free-text notes remain available but are not resolution mechanisms

**Status: ❌ Not started**

---

## Phase 6 — Backend, Database & Audit Trail
**Owner:** Member 1
**Goal:** Every inspection, decision, and override is persisted. Reports are append-only.

### Tasks
- Inspection CRUD, image upload, submit, report retrieval
- `FieldResult` rows store full evidence JSON per field
- `ReviewRecord` for supervisor overrides (never edits the original row)
- Audit trail: original report + all overrides in order
- JWT auth: inspector vs. supervisor roles enforced

### Definition of done
Inspector token cannot call override endpoint. Supervisor can override.
Audit trail shows original + override.

**Status: ✅ Mostly complete**

---

## Phase 7 — Mobile &amp; Dashboard Integration
**Owner:** Member 1 + Member 2
**Goal:** Full pipeline runs end-to-end on a real device.

### Tasks
- Mobile result screen: per-field decision + evidence (image + bbox)
- Dashboard: inspection list, REVIEW queue, evidence viewer with bbox overlay
- Dashboard override flow wired to backend
- Audit trail visible in dashboard

### Offline sync failure testing (Gap 13 — must be done in this phase)
Before "sync status display" ships:
- Explicitly test: what the UI shows during a failed sync
- Explicitly test: what happens if the app is closed mid-sync
- "Sync status display" cannot ship as a happy-path-only feature with untested
  failure paths. If these aren't tested, the phase is not done.

### Definition of done
Inspector captures on phone → dashboard shows result with evidence.
Supervisor finds REVIEW, overrides it, sees it in audit trail.
Failed sync shows an error state (not silent). Mid-sync app-close is safe.

**Status: ✅ Partially complete — basic flow works; bbox overlay on dashboard pending**

---

## Phase 8 — Adversarial Testing & Evaluation
**Owner:** Everyone
**Goal:** The system fails the right things and passes the right things,
measured against real data.

### Adversarial tests (in CI — must currently FAIL for any broken behaviour)
See `tests/adversarial/test_ps26034_failures.py`.

| # | Scenario | Expected outcome |
|---|---|---|
| 1 | Bare `₹149` with no MRP label | MRP → NOT_FOUND or REVIEW (not PASS) |
| 2 | `Offer ₹149` + `MRP ₹199` on same label | MRP = ₹199, not ₹149 |
| 3 | Consumer Care on back, only front captured | REVIEW (not FAIL) |
| 4 | Blurry Consumer Care, low OCR confidence | REVIEW |
| 5 | OCR1 = ₹199, OCR2 = ₹299 for same field | CONFLICTING → REVIEW |
| 6 | `Manufactured: 08/2026` + `Best Before: 12 months` | Two separate fields |
| 7 | `Customer Care: 1800…` + `Sales: 987…` on same label | Only first is Consumer Care |
| 8 | Secondary OCR engine unavailable | REVIEW (not fake dual-OCR PASS) |
| 9 | Hindi-only declaration | Processed correctly or REVIEW (not FAIL) |
| 10 | All fields found at confidence 0.45 | Overall → REVIEW (not PASS) |

### Domain validation dataset
- 60–100 real Indian FMCG packages, manually annotated
- Annotators must not use AI output as ground truth
- Report: MRP precision/recall, false PASS rate, false FAIL rate, REVIEW rate

### Definition of done
All 10 adversarial tests pass. False PASS rate on adversarial dataset = 0.

---

## Phase 9 — Human Review, Reporting &amp; Decision Quality
**Owner:** Member 1 + Lead
**Goal:** REVIEW items have a clear path to supervisor resolution, and the system
measures its own error rate so calibration doesn't silently decay.

### Tasks
- Per-field evidence viewer with image region and reason
- Supervisor REVIEW queue sorted by time
- Override stores: reviewer_id, reason, previous/new decision, timestamp
- Printable/PDF report for field use
- **Report completeness guarantee:** generation fails loudly (raises error) if a field
  with `state=FOUND` renders as blank in the output — see CONTRACTS.md §7

### Decision quality tracking (Gap 4)
Track per reporting period:
- % of inspections that land in REVIEW
- % of REVIEW items later overridden vs. confirmed by supervisor
- Which field most often drives a REVIEW outcome

This is **measurement, not prediction** — surface as a simple trend count/rate on the
dashboard. Must not be presented as a risk score or ML output. Feeds directly from the
structured correction data introduced in Phase 3.5.

### Definition of done
Supervisor can resolve all 10 adversarial REVIEWs from the dashboard UI.
Decision quality trends visible on dashboard as count/rate per period.
Report generation raises an error for any state=FOUND + blank output case.

**Status: ⚠️ Partial**

---

## Phase 10 — SIH Demo Hardening
**Owner:** Everyone + Lead as integration lead
**Goal:** Full flow live, cold, in under 3 minutes.

### Tasks
- Seed demo environment with known PASS / FAIL / REVIEW examples
- "Out of scope" slide matches what the system actually does (no overclaiming)
- Walk full flow at least 5 times before presenting
- Every TODO(stub) either resolved or named in the presentation

### Definition of done
Full capture-to-dashboard flow runs live, cold, in under 3 minutes.
Presenter can answer "what does your system actually do?" accurately.
