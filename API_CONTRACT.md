# API_CONTRACT.md

All endpoints under `/api/v1`. JSON in, JSON out. Auth via `Authorization:
Bearer <jwt>` except where noted.

## Inspections

**POST /inspections**
Create a new inspection. Body: `{ inspector_id }`. Returns `{ inspection_id, status: "capturing" }`.

**POST /inspections/{id}/category**
Inspector-confirmed category. Body: `{ category }`. Required before
submission — this is what CONTRACTS.md #4 depends on.

**POST /inspections/{id}/images**
Multipart upload. Body: image file + `role` (`front` | `back` | `close_up`).
Returns `{ image_id, role, quality, accepted }` (Capture & quality check
output — see CONTRACTS.md #1).

**POST /inspections/{id}/analyze**
Phase 3.5: Runs the OCR and rule engine pipeline, returning a draft `AnalyzeResponse` including the `RuleResult` list and any `category_mismatch` warning. Does not persist the final report.

**POST /inspections/{id}/submit**
Accepts `corrections` (inspector resolutions for `REVIEW` fields) and finalizes the inspection report. Blocks submission if any `REVIEW` fields are left unacknowledged.

**GET /inspections/{id}**
Returns the stored `InspectionReport`, including all `RuleResult` and
`FieldEvidence` objects (for the evidence viewer).

**GET /inspections**
Query params: `status` (PASS|FAIL|REVIEW), `category`, `date_from`,
`date_to`, `inspector_id`. Used by the dashboard's inspection list and
REVIEW queue.

## Review / override (supervisor role only)

**POST /inspections/{id}/review**
Body: `{ overridden_decision, reason, reviewer_id }`. Never edits the
original report — creates a linked `ReviewRecord` referencing it. See
CONTRACTS.md #7 (append-only).

**GET /inspections/{id}/audit**
Returns the full audit trail: original report + any review records, in
order.

## Rules

**GET /rules/{category}**
Returns the active rule set and `rule_version` for a category. Used by the
applicability engine and displayable in the dashboard for transparency.

## Auth

**POST /auth/login** — `{ email, password }` → `{ token, role }`
No other endpoint is unauthenticated.

## Response shape for errors

```json
{ "error": { "code": "string", "message": "string" } }
```
Never return a bare 500 with no body — the mobile app needs a message it
can show the inspector in the field.
