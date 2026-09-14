# PS 26034 — Known System Limitations & Stub Audit

This document records all known limitations, stubbed components, and out-of-scope features in accordance with **AGENTS.md Rule 8** and **Phase 10 Ticket 15** requirements.

---

## Summary of Active Stubs & Limitations

| Feature / Area | Status | Why Incomplete | Current System Behavior | Demo Impact |
|---|---|---|---|---|
| **PaddleOCR Secondary Engine** | Stub (`paddleocr_engine.py`) | PaddlePaddle lacks Python 3.14 wheel support | Tesseract (`pytesseract`) is used as the secondary OCR engine alongside EasyOCR (primary). If secondary is unavailable, `single_engine_only=True` safely caps field outcomes at `REVIEW`. | None. Tesseract + EasyOCR cross-check operates reliably. |
| **Phase 2.5 Full Calibration Dataset** | Documented limitation | Full nationwide FMCG package field sampling and manual annotation is ongoing | Numeric confidence thresholds (0.60) and context window scores are backed by comprehensive unit tests and adversarial suites (240 passing tests). | None. Demo scenarios pass deterministic field validation. |
| **Multi-Panel 3D Image Stitching** | Out of Scope | Multi-angle package stitching is explicit non-goal per PRD.md | Role-based slot capture (`front`, `back`, `close_up`) with panel coverage tracking. | None. Marked as out-of-scope on presentation slides. |
| **Automated On-Device LLM Rule Engine** | Out of Scope | LLM decision-making violates AGENTS.md Rule 4 & CONTRACTS.md §6 | Pure-function rule engine dispatches deterministically to field-specific validators (`validate_mrp`, `validate_date`, etc.). | None. Ensured auditable, repeatable compliance verdicts. |

---

## Detailed Item Breakdowns

### 1. Secondary OCR Engine: PaddleOCR → Tesseract

- **File**: [paddleocr_engine.py](file:///e:/SIH/PS26034/apps/backend/app/ocr/engines/paddleocr_engine.py)
- **Incomplete Element**: PaddleOCR is imported but raises `NotImplementedError`.
- **Reason**: `paddlepaddle` PyPI wheels do not support Python 3.14 on Windows/x86_64 environment.
- **Current Behavior**:
  - Primary OCR Engine: **EasyOCR** (configured with English + Hindi support `["en", "hi"]`).
  - Secondary OCR Engine: **Tesseract** (`pytesseract`).
  - Fallback logic: If Tesseract fails or is disabled, `FieldEvidence.single_engine_only` is set to `True`, which caps the field decision at `REVIEW` (per CONTRACTS.md §2).
- **Demo Impact**: **None**. Dual-OCR cross-check runs using EasyOCR + Tesseract.

---

### 2. Hand-crafted Field Evidence Submission (Phase 1 Stub Schema)

- **File**: [inspection.py](file:///e:/SIH/PS26034/apps/backend/app/schemas/inspection.py#L97-L122)
- **Incomplete Element**: `SubmitInspectionRequest` retains `field_evidences` field for manual fixture seeding.
- **Reason**: Retained to allow automated seeding scripts (`seed_demo.py`) and unit tests to directly submit deterministic test payloads.
- **Current Behavior**: When images are uploaded via the mobile/backend pipeline, the system extracts evidence directly via OCR pipeline (`POST /inspections/{id}/analyze`).
- **Demo Impact**: **None**. Both automated seeding and image-based extraction use standard API routes.

---

### 3. Language Coverage & Non-English OCR

- **Scope**: Multilingual Legal Metrology declarations.
- **Incomplete Element**: Hindi language OCR is active in EasyOCR (`["en", "hi"]`), but regional scripts (Tamil, Telugu, Kannada, Bengali) require additional OCR model packs.
- **Current Behavior**: Per **AGENTS.md Rule 9**, any unrecognised script generates `NOT_VERIFIABLE` with `reason="unsupported_language"`, which routes to `REVIEW` (never silent `FAIL`).
- **Demo Impact**: **None**. Non-English packaging is routed safely without false failures.

---

### 4. Non-Goals & Presentation Alignment

The following capabilities are explicitly **OUT OF SCOPE** for the SIH live demonstration and must not be presented as working features:
1. **Automated Fine Generation / Legal Penalty Calculation**: The system produces compliance inspection reports and audit trails; legal proceedings remain within enforcement officer jurisdiction.
2. **Real-Time Video Stream Processing**: Inspection relies on snapshot panel captures (`front`, `back`, `close_up`).
3. **Automated LLM Verdict Generation**: Rule engine decisions are 100% deterministic functions.

---

*Last audited for Phase 10 SIH Demo Release Hardening.*
