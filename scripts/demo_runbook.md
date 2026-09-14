# PS 26034 — Demo Runbook
**SIH Stage · Target time: ≤ 3 minutes cold**

---

## Before you walk on stage

Run these once (5–10 minutes ahead):

```powershell
# 0. CHECK: Is Tesseract installed? (secondary OCR engine)
tesseract --version
# If the above fails, install it now (takes ~2 min) — optional but recommended:
#   winget install UB-Mannheim.TesseractOCR -e
# Without Tesseract: live mobile OCR will work but ALL fields will be capped
# at REVIEW (single_engine_only=True). Seeded demo cases are unaffected.

# 1. Start backend (terminal A — keep open)
cd apps/backend
uv run uvicorn main:app --host 0.0.0.0 --port 8000

# 2. Seed demo data (terminal B — run once, idempotent)
python scripts/seed_demo.py

# 3. Start dashboard (terminal C — keep open)
cd apps/dashboard
pnpm dev        # → http://localhost:3000

# 4. Optionally start the Expo mobile app (terminal D)
cd apps/mobile
npx expo start --clear
```

Verify in browser:
- `http://localhost:8000/health` → `{"status":"ok","version":"0.6.0"}`
- `http://localhost:3000` → shows seeded inspections after login

---

## Demo accounts (on screen if needed)

| Role | Email | Password |
|---|---|---|
| Inspector | `inspector@demo.ps26034` | `inspector123` |
| Supervisor | `supervisor@demo.ps26034` | `supervisor123` |

---

## The 3-minute script

### Segment 1 — Problem (20 sec)

> "Field inspectors check dozens of packaged products a day for Legal
> Metrology compliance — MRP, net quantity, manufacturing date, manufacturer
> name, consumer care. Today it's paper-based and takes hours.
> PS 26034 makes it a one-minute AI-assisted phone scan."

---

### Segment 2 — Mobile capture (40 sec)

Open the Expo app on a phone / emulator.

1. Tap **New Inspection** → an inspection ID is created instantly.
2. Point camera at a packaged product → tap **Front**, **Back**, **Close-up**.
   - Each upload shows a real-time quality badge (HIGH / MEDIUM / LOW).
3. Confirm the **category** (`packaged_food`) — this is inspector-verified, never auto-assumed.
4. Tap **Submit** → OCR pipeline runs, rule engine fires.

> "In under 10 seconds, every mandatory field is processed by the OCR pipeline
> and cross-checked against a secondary engine when available."

---

### Segment 3 — Result screen (30 sec)

The result screen appears with the overall decision banner.

Point to:
- The **PASS / FAIL / REVIEW** banner at the top.
- Individual field rows — tap one to expand the evidence detail:
  - OCR value, confidence %, bbox region, which engine found it.
- The **rule version** label (`v1.1`) — proof that old reports are auditable after rule changes.

> "Every field decision traces back to an exact image region. No black-box output."

---

### Segment 4 — Dashboard REVIEW queue (40 sec)

Open `http://localhost:3000` in the browser. Log in as **supervisor**.

1. Click **REVIEW Queue** in the nav.
   - Show the seeded REVIEW inspection (MRP conflict — two different prices read).
2. Click **View →** to open the detail page.
   - Point to the MRP row: state = CONFLICTING, candidates = `₹149.00 vs ₹199.00`.
   - Point to the manufacturing_date row: state = NOT_VERIFIABLE (low image quality).
3. Scroll to **Supervisor Override**.
   - Select decision = **FAIL**.
   - Type reason: *"Physical check confirms MRP sticker damaged — override to FAIL."*
   - Click **Submit Override**.

> "The original report is never changed — the override is appended as a separate record."

---

### Segment 5 — Audit trail (25 sec)

Click **Audit trail →** on the detail page.

Show:
- Step 1: original automated report — REVIEW decision with conflicting evidence.
- Step 2: supervisor override — FAIL, with the typed reason and timestamp.

> "Every decision is traceable. No silent edits, no data loss."

---

### Segment 6 — Scope honesty (15 sec)

> "What we are NOT claiming:
> - The mobile app retains a failed upload locally for retry, but final
>   submission to the backend requires network connectivity.
> - Not a legal certificate — a **preliminary** AI-assisted assessment.
> - REVIEW outcome is not an error. It's the system correctly saying
>   'a human needs to look at this.'
> - Rule changes are human-reviewed and versioned, never auto-applied."

---

### Segment 7 — Wrap (10 sec)

> "Full pipeline: capture → OCR → rule engine → supervisor review → audit trail.
> In under 3 minutes, live, on real hardware. Thank you."

---

## Timing guide

| Segment | Target |
|---|---|
| Problem | 20 s |
| Mobile capture | 40 s |
| Result screen | 30 s |
| Dashboard REVIEW | 40 s |
| Audit trail | 25 s |
| Scope honesty | 15 s |
| Wrap | 10 s |
| **Total** | **~3 min** |

---

## Fallback if the phone is slow

The seeder already created PASS/FAIL/REVIEW inspections in the dashboard.
Skip segments 2–3 and go straight to segment 4.
Say: *"We've pre-seeded three inspection types — let me show the supervisor workflow."*

---

## Scope accuracy check (vs PRD.md non-goals)

The following are explicitly **out of scope** — do NOT demo or imply these work:

| Non-goal | What to say if asked |
|---|---|
| Offline mode | "Not in this MVP — requires connectivity" |
| Languages beyond English/Hindi | "Other languages route to REVIEW automatically" |
| Font-size measurement | "We estimate readability but never FAIL on font size alone" |
| Barcode / product identity | "Out of scope — product identity is a Phase 2 roadmap item" |
| Automated rule updates | "Rule changes are human-reviewed, tagged with a version, never auto-applied" |
| Placement-compliance guarantee | "We provide spatial evidence, not a placement guarantee" |
| Image tamper detection | "Capture-through-app only — stated limitation" |

---

## Known limitations to mention proactively

- Tesseract secondary engine requires a separate install (`winget install UB-Mannheim.TesseractOCR -e`).
  If absent, live mobile OCR fields are marked `single_engine_only=True` and capped at REVIEW —
  this is correct behaviour per CONTRACTS.md §2. Seeded PASS/FAIL/REVIEW cases in the dashboard
  are unaffected by Tesseract availability.
- Demo DB is SQLite; production would be PostgreSQL.
- Auth is demo-quality in-memory user store; production needs a proper DB-backed users table.

---

## If something breaks

| Symptom | Fix |
|---|---|
| Backend 500 | Check terminal A for traceback; restart `uvicorn` |
| Dashboard shows "Backend error" | Confirm backend is on port 8000, CORS is open |
| Seed script fails | Run `python scripts/seed_demo.py --url http://localhost:8000` again — it's idempotent |
| Expo app won't connect | Change `EXPO_PUBLIC_API_URL` to your machine's LAN IP |
