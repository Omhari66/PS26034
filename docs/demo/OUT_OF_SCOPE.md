# PS 26034 — What This System Does and Does Not Do

**Use this for your presentation slide and for answering questions honestly.**

---

## What the system DOES

| Capability | Detail |
|---|---|
| Guided image capture | Inspector captures front, back, and close-up via mobile app |
| OCR on captured images | EasyOCR (English) extracts text and bounding boxes |
| MRP extraction with context | Distinguishes MRP label from offer/sale prices using keyword scoring |
| Net quantity extraction | Extracts value + unit from declared quantity |
| Manufacturing date extraction | Extracts mfg/packing date (not best-before) |
| Manufacturer extraction | Extracts entity name with role keyword context |
| Consumer care extraction | Extracts contact with consumer-care keyword proximity |
| Evidence-backed decisions | Every PASS/FAIL/REVIEW traces to a specific image region |
| Coverage-gated FAIL | NOT_FOUND only becomes FAIL when both front and back panels were photographed |
| Versioned rules | `rule_version` stamped on every report; old reports are immutable |
| Supervisor override | REVIEW items can be overridden with a recorded reason |
| Append-only audit trail | No report is ever edited or deleted |
| Three decisions | PASS / FAIL / REVIEW (REVIEW is first-class, not a fallback) |

---

## What the system does NOT do

| Out of scope | Reason |
|---|---|
| Legal certification | The system is an assistance tool, not a legal authority |
| Font size compliance | Cannot reliably measure physical font size from uncalibrated phone photos |
| Placement validation | Cannot verify "principal display panel" from image position alone |
| Hindi / regional language OCR | EasyOCR currently initialised English-only |
| Best-before / expiry date | Date extractor targets mfg/packing date; BBD is not separately verified |
| Barcode / product identity | No SKU or barcode linkage; category is inspector-confirmed |
| Country of origin | Not in the 5 MVP fields |
| Batch number | Not in the 5 MVP fields |
| Automatic category detection | Inspector selects category; system does not infer it |
| Complete LM(PC) Rules 2011 | 5 of the required declarations; full rule set is Phase 2+ roadmap |
| Offline operation | Requires network connection to backend |
| Multi-language label analysis | Single OCR pass per image |

---

## The honest one-line description

> **PS 26034 is an AI-assisted preliminary Legal Metrology packaging compliance
> assessment tool that uses OCR and a deterministic rule engine to help inspectors
> check whether five mandated declarations appear on a product label — with
> evidence-backed decisions and an explicit REVIEW state for uncertain findings.**

This is what the system actually does. Do not expand this claim during the presentation.
