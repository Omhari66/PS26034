# PRD — PS 26034: AI-assisted Legal Metrology inspection platform

## One-liner
A mobile-first app for field inspectors to photograph product packaging and
get an evidence-backed preliminary compliance check, plus a web dashboard
for supervisors to review, override, and audit inspections.

## Framing (repeat this in every pitch/demo)
This is an **AI-assisted preliminary assessment tool**, not an automated
legal certification. Weak or missing evidence routes to human REVIEW rather
than a confident PASS or FAIL.

## Users

- **Field inspector (mobile app):** photographs packaging on-site, sees an
  immediate preliminary result, flags items for review.
- **Supervisor / reviewer (web dashboard):** reviews REVIEW-queue items,
  can override decisions, sees inspection history and audit log, exports
  reports.

## MVP scope — the 5 declarations we check

1. MRP (Maximum Retail Price)
2. Net quantity
3. Manufacturing date
4. Manufacturer name
5. Consumer care contact

Each gets: `FieldEvidence` (FOUND / NOT_FOUND / NOT_VERIFIABLE /
CONFLICTING) → `RuleResult` (PASS / FAIL / REVIEW / NOT_APPLICABLE) → one
overall `Decision` per inspection.

## Core user stories

- As an inspector, I capture front / back / close-up photos and see which
  are still missing before I can submit.
- As an inspector, I get a result with each field's status and the exact
  image region that produced it.
- As a supervisor, I see a queue of REVIEW items sorted by priority and can
  resolve each with a documented override.
- As a supervisor, I can see which rule version was used for any past
  inspection, even after rules have changed since.

## Explicit non-goals (say these out loud, don't apologize for them)

- No offline mode — requires connectivity for this MVP.
- No language support beyond English + Hindi; other languages → REVIEW.
- No calibrated font-size measurement — readability-estimate only, always
  routes to REVIEW, never FAIL, on font-size alone.
- No barcode-based product identity or repeat-offender analytics.
- No automated legal rule updates — rule changes are human-reviewed and
  versioned, never auto-applied.
- No claim of full placement-compliance verification — we provide spatial
  evidence, not a placement guarantee.
- No production-grade image tamper detection — capture-through-app only,
  as a stated limitation.

## Success criteria for the SIH demo

- End-to-end flow works live: capture → evidence → decision → dashboard.
- At least one FAIL, one PASS, and one REVIEW case demoable on request.
- Evidence viewer can show, for any field, the exact image + bbox behind
  the decision.
- Rule version is visible on every report.

## Product principles

1. A detected value is not evidence. Evidence is not compliance.
2. REVIEW is a first-class outcome. Uncertainty routes to a human.
3. The rule engine is a pure function. Same input, same output, always.
4. Reports are append-only. A correction is a new report, not an edit.
5. No stubbed functionality is presented as working.
6. Every compliance decision traces back to a specific image + bbox + confidence.
7. The system's stated scope is what the system actually does — no more, no less.
8. **If a human already told us the answer, did we check whether the evidence agrees —
   or did we just store both and hope someone notices?**
