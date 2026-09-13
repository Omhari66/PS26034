# PS 26034 — Complete System Architecture

## What is this project?

An **AI-assisted Legal Metrology packaging compliance inspection platform**.
A field inspector photographs a packaged product → AI reads the label → a rule engine checks it against real Indian law → result is PASS / FAIL / REVIEW.

---

## The Full Flow (End to End)

```
📱 Inspector takes 3 photos
        │
        ▼
┌─────────────────┐
│  QUALITY GATE   │  Rejects corrupt/unusable images (blur, darkness, resolution)
│  quality.py     │  Phone camera photos → typically "medium" or "high"
└────────┬────────┘
         │ accepted images (file paths stored in SQLite)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     OCR PIPELINE   (pipeline.py)                │
│                                                                 │
│  PASS 1 — Primary OCR Engine (full image scan)                  │
│    EasyOCR reads entire image → list of (text, bbox, confidence)│
│                                                                 │
│  PASS 2 — Field Extraction (field_extractor.py)                 │
│    Regex patterns scan OCR results for each of 5 fields         │
│    e.g. "MRP Rs. 149" → captured group "149"                   │
│                                                                 │
│  PASS 3 — Secondary Cross-check (per-region OCR)                │
│    Same or different engine zooms into the specific bbox         │
│    found by pass 1 and re-reads it independently                │
│    If readings agree → FOUND                                    │
│    If readings disagree → CONFLICTING                           │
│    If no secondary engine available → NOT_VERIFIABLE            │
└────────┬────────────────────────────────────────────────────────┘
         │ 5 × FieldEvidence objects (never a bare string — always with proof)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   RULE ENGINE   (compliance_engine.py)          │
│                                                                 │
│  For EACH field (MRP, Net Qty, Mfg Date, Mfr Name, Consumer    │
│  Care), evaluate_field() runs this EXACT decision table:        │
│                                                                 │
│   EvidenceState       Required?   → Decision                    │
│   ─────────────────── ─────────   ──────────                    │
│   FOUND + conf ≥ 0.6  yes/no    → PASS                         │
│   FOUND + conf < 0.6  yes/no    → REVIEW (low confidence)      │
│   NOT_FOUND           yes       → FAIL                          │
│   NOT_FOUND           no        → NOT_APPLICABLE                │
│   NOT_VERIFIABLE      yes/no    → REVIEW                        │
│   CONFLICTING         yes/no    → REVIEW                        │
│                                                                 │
│  aggregate_overall() combines all 5 field decisions:            │
│   FAIL anywhere → overall FAIL                                  │
│   No FAIL, REVIEW anywhere → overall REVIEW                     │
│   All PASS → overall PASS                                       │
└────────┬────────────────────────────────────────────────────────┘
         │ InspectionReport (append-only, stored in SQLite)
         ▼
┌──────────────────────┐      ┌─────────────────────────────────┐
│  📱 MOBILE RESULT    │      │  🖥️ DASHBOARD (Next.js)          │
│  PASS / FAIL / REVIEW│      │  Supervisor sees all reports     │
│  per-field breakdown │      │  Can REVIEW → override decision  │
│  with evidence shown │      │  Audit trail (append-only)       │
└──────────────────────┘      └─────────────────────────────────┘
```

---

## The OCR Layer — Which Model?

### Current State: EasyOCR (stub/dev mode)

```
apps/backend/app/ocr/engines/
├── base.py              ← Abstract OCREngine interface
├── easyocr_engine.py    ← PRIMARY engine (actually used right now)
└── paddleocr_engine.py  ← SECONDARY engine (imported but marked TODO(stub))
```

**EasyOCR** is the active engine. It:
- Is a deep-learning OCR model (CRNN + attention) that runs entirely on CPU
- Reads printed text from images without any API calls
- Returns: `(text_string, bounding_box, confidence_score)` per word/line
- The `paddleocr_engine.py` exists as a stub for the cross-check pass but is **not active** yet

> **TODO(stub)** markers in the code show where the PaddleOCR second engine
> will plug in when calibrated with real field photos.

---

## The Field Extractor — How Does it Find "MRP = ₹149"?

**It uses regex patterns, NOT an LLM.** This is intentional — AGENTS.md rule 4:
> "The rule engine is a pure function. No LLM calls, no randomness."

```python
# From field_extractor.py — the MRP patterns:
_MRP_PATTERNS = [
    # "MRP (Incl. of all taxes): Rs. 1,299.00"
    r"(?:MRP|M\.?R\.?P\.?)\s*[:()\s]*(?:Rs\.?|₹|INR\s*)?\s*(\d[\d,]*(?:\.\d{1,2})?)",

    # "Rs. 149" / "₹1,299"
    r"(?:Rs\.?|₹)\s*(\d[\d,]*(?:\.\d{1,2})?)",
]
```

Each field has its own pattern list (ordered most-specific → most-general):

| Field | Example label text matched |
|---|---|
| MRP | `MRP: Rs. 149` / `₹299` |
| Net Quantity | `Net Wt. 500g` / `1.5 l` |
| Mfg Date | `Mfg. Date: 01/2025` / `Jan 2025` |
| Manufacturer Name | `Manufactured by: Acme Corp` |
| Consumer Care | `Consumer Care: 1800-123-4567` / `care@brand.com` |

---

## The Rule Engine — Is it real FSSAI/LM(PC) Rules 2011?

**YES — it references actual statute.** The rules come from a versioned JSON file:

```json
// apps/backend/app/rules/rule_table_v1.json
{
  "rule_version": "v1.0",
  "_comment": "Legal Metrology (Packaged Commodities) Rules 2011",
  "rules": [
    {
      "rule_id": "LM-MRP-001",
      "field": "mrp",
      "legal_ref": "Rule 6(1)(c) — LM(PC) Rules 2011",
      "description": "MRP must be declared in full (inclusive of all taxes) in Indian rupees."
    },
    {
      "rule_id": "LM-NQ-001",
      "field": "net_quantity",
      "legal_ref": "Rule 6(1)(a) — LM(PC) Rules 2011"
    },
    {
      "rule_id": "LM-MD-001",
      "field": "manufacturing_date",
      "legal_ref": "Rule 6(1)(f) — LM(PC) Rules 2011"
    },
    {
      "rule_id": "LM-MN-001",
      "field": "manufacturer_name",
      "legal_ref": "Rule 6(1)(b) — LM(PC) Rules 2011"
    },
    {
      "rule_id": "LM-CC-001",
      "field": "consumer_care",
      "legal_ref": "Rule 6(1)(k) — LM(PC) Rules 2011"
    }
  ]
}
```

**But the evaluation logic is NOT just if/else.** It's a stateful evidence machine:

```
Evidence State (what OCR saw)   →   Rule Decision
──────────────────────────────      ────────────────────────────────────
FOUND   (high confidence)       →   PASS  ✓
FOUND   (confidence < 60%)      →   REVIEW ⚠️  (OCR unsure, human verify)
NOT_FOUND  (field required)     →   FAIL ✗  (e.g. no MRP = LM-MRP-001 violation)
NOT_FOUND  (field optional)     →   NOT_APPLICABLE (e.g. textiles don't need Net Qty)
NOT_VERIFIABLE                  →   REVIEW ⚠️  (camera angle didn't cover this)
CONFLICTING                     →   REVIEW ⚠️  (primary and secondary OCR disagree)
```

The `required_fields` per category are also in the JSON — so **Textiles** only need
MRP + Manufacturer (not Net Qty or Mfg Date), but **Packaged Food** needs all 5.
This is exactly per Schedule II of LM(PC) Rules 2011.

---

## Why REVIEW is a First-Class Outcome (not a fallback)

Most systems give you PASS or FAIL. We give three:

| Outcome | Meaning |
|---|---|
| **PASS** | All required fields found, high-confidence, consistent readings |
| **FAIL** | A required field is provably absent (NOT_FOUND with full coverage) |
| **REVIEW** | Evidence is weak, conflicting, or ambiguous — supervisor must decide |

REVIEW is not "we couldn't decide." It's "we have evidence but it's not enough
to make a legally-defensible automatic decision." A supervisor looks at the audit
trail and makes the final call. That override is also stored (append-only).

---

## What the Dashboard Supervisor Sees

```
Report
│
├── Overall: REVIEW
│
├── MRP:              REVIEW  ← confidence 0.42 (too low)
│   └── Evidence: value="149", bbox=[120,80,300,140], engine=easyocr, conf=0.42
│
├── Net Quantity:     PASS
│   └── Evidence: value="500g", bbox=[…], conf=0.91
│
├── Mfg Date:         FAIL    ← not found anywhere on label
│   └── Evidence: state=NOT_FOUND
│
├── Manufacturer:     PASS
└── Consumer Care:    NOT_VERIFIABLE  ← back of pack not photographed
```

Every field result links back to:
- The **image bbox** (where on the label it was found)
- The **OCR confidence** score
- The **engine name** that read it
- The **rule ID** and legal citation

---

## Summary of Architecture Layers

```
Layer              Tech                      What it does
──────────────────────────────────────────────────────────────
Mobile (UI)        React Native / Expo       Camera capture, submit flow
API                FastAPI + JWT auth        Routes, auth, validation
Quality Gate       Pillow + NumPy            Rejects bad images
OCR Engine         EasyOCR (+ PaddleOCR*)   Reads text from images
Field Extractor    Regex patterns            Maps OCR output → field values
Evidence Builder   pipeline.py              Assigns EvidenceState per field
Rule Engine        compliance_engine.py      LM(PC) Rules 2011 → PASS/FAIL/REVIEW
Storage            SQLite (dev) / PostgreSQL Inspection + audit records
Dashboard          Next.js                  Supervisor review + overrides
```

`* PaddleOCR = TODO(stub) — second engine for cross-check not yet active`
