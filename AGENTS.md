# AGENTS.md — read this before touching any code

You are building **PS 26034**: a mobile-first AI-assisted Legal Metrology
packaging-compliance inspection platform, with a separate web dashboard for
supervisors/reviewers. This file is the contract you operate under. The
other docs in this repo are context; this file is law.

## Read order (every session)

1. `AGENTS.md` (this file)
2. `PRD.md` — what we're building and, just as important, what we are NOT building
3. `ARCHITECTURE.md` — tech stack, repo layout, module boundaries
4. `PHASES.md` — the current phase and its definition of done
5. `CONTRACTS.md` — per-module input/output rules
6. `compliance_engine.py` — the canonical evidence + decision schema
7. `API_CONTRACT.md` — the endpoints mobile/web are allowed to call

## Non-negotiable rules

1. **Never invent evidence.** Every field value must trace back to an image
   + bbox + OCR confidence. If you can't point to the source, the value
   doesn't exist yet.
2. **`EvidenceState` and `Decision` are defined exactly once**, in
   `compliance_engine.py` (or its ported backend equivalent). Every module
   imports them from there. If you're about to define
   `COMPLIANT/NON_COMPLIANT` or any other parallel enum, stop — import the
   shared one instead.
3. **REVIEW is a first-class outcome**, not a fallback for errors. Weak or
   conflicting evidence routes to REVIEW, never to a guessed PASS or FAIL.
4. **The rule engine is a pure function and a router, not a decision-maker.**
   `evaluate_field()` dispatches by `rule_id` to the field's own validator function.
   No LLM calls, no network calls, no randomness inside any validator. Same input,
   same output, always — this is what makes it testable and demoable.
   If you see two different `rule_id`s sharing identical code paths for materially
   different legal requirements — **stop**. That is the same bug the original audit
   caught (finding A2).
5. **Reports are append-only.** Never edit or delete a generated inspection
   report. Corrections happen by creating a new report against a new
   `rule_version`.
6. **Stay inside your phase.** Follow `PHASES.md` in order. Do not start
   work belonging to a later phase even if it looks easy or related. Finish
   the current phase's definition of done, then stop and report back.
7. **Stay inside your module's contract.** See `CONTRACTS.md`. If a task
   seems to require crossing a boundary (e.g. the rule engine needing to
   call an LLM), stop and flag it instead of quietly doing it.
8. **No stubbed functionality presented as done.** A mocked OCR call or a
   hardcoded "success" response must be clearly marked
   `# TODO(stub): replace with real integration` and mentioned in your
   summary — never silently passed off as working.

9. **Language routing must exist before language coverage expands.** Any OCR
   result in an unsupported script must produce `NOT_VERIFIABLE` with
   `reason="unsupported_language"` — **never NOT_FOUND**. NOT_FOUND + full coverage
   + required = FAIL. Routing an unsupported language to NOT_FOUND silently fails
   every compliant non-English label in the country.

10. **Inspector-supplied values must be reconciled against AI-extracted values,
    not just stored alongside them.** Storing both and hoping someone notices a
    discrepancy is not a cross-check. If a human entered ₹180 and the system
    extracted ₹149, the disagreement must be surfaced before submission.

## When you're unsure

Stop and ask, in plain terms, rather than guessing and continuing. A
half-built feature that's flagged as incomplete is fine. A fully-built
feature that quietly violates one of the rules above is not.
