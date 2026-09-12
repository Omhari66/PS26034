# ARCHITECTURE.md

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Mobile app | React Native (Expo) | Fastest path to camera + upload UI on both platforms; one codebase |
| Web dashboard | Next.js (React) | Matches team's existing React/Node experience |
| Backend API | FastAPI (Python) | OCR/CV libraries are Python-native; team already knows pandas/sklearn |
| OCR | **EasyOCR** (primary, `["en","hi"]`) + **Tesseract** (secondary, independent architecture) | Genuine dual-engine cross-check on Windows/Python 3.14 without Docker. PaddleOCR was the original primary choice but has no Python 3.14 wheel on Windows. Decision formalised in "Known Decisions" below. |
| Rule engine | Plain Python, `compliance_engine.py` | Pure function, no framework needed — this is deliberate |
| Database | PostgreSQL | Relational fits inspections/rules/audit-log well |
| Image storage | Object storage (S3-compatible; local disk fine for the demo) | Keep original images for evidence + audit |
| Auth | Simple JWT-based auth, two roles: `inspector`, `supervisor` | Enough for MVP, no need for full IAM |

## Repo layout

```
/apps
  /mobile          — Expo inspector app (React Native)
  /dashboard       — Next.js supervisor dashboard
  /backend         — FastAPI service (OCR, rule engine, API); managed with uv
/packages
  /shared-schema/
    compliance_engine.py   ← SINGLE SOURCE OF TRUTH for EvidenceState,
                              Decision, and all evidence/result dataclasses.
                              Backend imports directly from this file.
    __init__.py            ← re-exports all public symbols
    ts/
      schema.ts            ← TypeScript mirror (same string values, maintained
                              in sync with compliance_engine.py by hand)
/(root docs)
  AGENTS.md
  PRD.md
  ARCHITECTURE.md   (this file)
  PHASES.md
  CONTRACTS.md
  API_CONTRACT.md
pnpm-workspace.yaml        ← pnpm workspaces covering apps/* and packages/*
```

`packages/shared-schema/compliance_engine.py` is the **one and only** copy of
`EvidenceState` and `Decision`. The backend imports from
`packages.shared_schema`; the mobile app and dashboard import
`packages/shared-schema/ts/schema.ts`. If these ever drift, that is a bug.
Never define `COMPLIANT/NON_COMPLIANT` or parallel enums anywhere else.

## Data flow (matches CONTRACTS.md module boundaries)

```
Mobile app
   → POST images to backend
Capture & quality check (backend)
   → accepted images, coverage map
OCR + evidence layer (backend)
   → FieldEvidence[]
Field extraction / normalization (backend)
   → normalized FieldEvidence[] with state set
Applicability engine (backend)
   → required-fields list, given inspector-confirmed category
Rule engine (backend, compliance_engine.py)
   → RuleResult[] + overall Decision
Report / audit (backend)
   → InspectionReport stored, append-only
Dashboard
   → reads InspectionReport[], REVIEW queue, audit log
```

## Environments

- `dev`: local Postgres + local file storage, for agent-driven development.
- `demo`: hosted version for the SIH presentation, seeded with known
  PASS/FAIL/REVIEW example products.

Keep these separate from day one — don't let demo seed data leak into dev
tests or vice versa.

---

## Known Decisions

### OCR secondary engine: Tesseract (not PaddleOCR)

**Date:** 2026-09-12
**Context:** PaddleOCR was the original planned primary engine. It raises `RuntimeError`
on construction under Python 3.14 on Windows (no compatible wheel shipped at the time).
Running `secondary = primary` would produce a fake cross-check.

**Decision:** EasyOCR as primary (`["en","hi"]`). Tesseract (`pytesseract` + UB-Mannheim
binary) as secondary. These are genuinely independent architectures:
- EasyOCR: neural CRNN-based text recognizer
- Tesseract: rule-based layout + LSTM text line classifier

This satisfies the dual-engine requirement without requiring Docker or a Linux container.

**Implication of single-engine fallback:** If Tesseract is unavailable at runtime,
the pipeline sets `single_engine_only=True` on affected `FieldEvidence` objects.
This caps the maximum achievable decision to **REVIEW** for those fields — they cannot
earN PASS. This is a deliberate safety design, not a temporary limitation.

**When to reconsider:** If PaddleOCR ships a Python 3.14 wheel and shows superior
precision/recall on the calibration dataset (Phase 2.5), reopen this decision.
