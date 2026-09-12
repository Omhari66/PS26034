# PS 26034 — SIH Demo Runbook

**Target time:** under 3 minutes  
**Practice runs required:** at least 5 times before presenting

---

## Before you start (checklist — do this the night before)

- [ ] Backend is running: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
- [ ] Seed data is loaded: `uv run python scripts/seed_demo.py`
- [ ] Dashboard is running and logged in as supervisor
- [ ] Mobile app is open on the physical device
- [ ] Phone is connected to the same WiFi as the laptop
- [ ] `API_URL` in mobile app points to your laptop IP (not localhost)
- [ ] You have 2–3 real packaged products ready (butter/biscuit/beverage)
- [ ] Products have clearly printed MRP, Net Qty, Mfg Date, Manufacturer, Consumer Care
- [ ] Battery on phone > 80%
- [ ] Screen brightness on phone: maximum
- [ ] Demo data visible on dashboard: 1 PASS, 1 FAIL, 1 REVIEW pre-seeded

---

## Demo flow (timed)

### 0:00 — Open with the problem (30 seconds, no touching anything yet)

> "In India, Legal Metrology inspectors physically visit warehouses and retail stores
> to verify that packaged products comply with the Packaged Commodities Rules 2011.
> Every product must declare five things: MRP, net quantity, manufacturing date,
> manufacturer name, and consumer care contact. Today, inspectors do this manually,
> on paper, field by field. We built a mobile-first tool that assists that process
> using OCR and a rule-based compliance engine."

**Do not say:** "AI verifies compliance" — the system assists, not certifies.

---

### 0:30 — Show the dashboard (30 seconds)

Open the dashboard. Point to the pre-seeded inspections.

> "This is the supervisor dashboard. An inspector has already completed three
> inspections. We can see one PASS, one FAIL — because MRP was not found on
> that label — and one REVIEW, because OCR confidence on the consumer care
> field was below our threshold. The supervisor can drill into any one of these."

Click the REVIEW inspection. Show the per-field evidence screen.

> "Here we can see exactly which image region the OCR read, the extracted value,
> the confidence score, and the reason for the REVIEW decision.
> The supervisor can override this with a recorded reason."

**Don't do the override live** — it's a one-way action. Show the button, explain it.

---

### 1:00 — Live capture on device (60 seconds)

Pick up the product. Open the inspector mobile app.

> "Now I'll do a live inspection. The app guides the inspector through capturing
> three images: front panel, back panel, and a close-up."

1. Tap **New Inspection**
2. Select category: **Packaged Food**
3. Tap **Capture Front** → hold product face-on → capture
4. Tap **Capture Back** → flip product → capture
5. Tap **Capture Close-up** → zoom on MRP/date area → capture
6. Tap **Submit**

While waiting for OCR (~5–10 seconds):
> "The images are sent to our backend, which runs OCR, extracts the five declared
> fields using pattern matching and context scoring, and runs them through a
> deterministic rule engine tied to the actual LM(PC) Rules 2011."

---

### 2:00 — Show the result screen (30 seconds)

Result appears on the mobile screen.

> "Here's the result. Each field shows its extracted value, the confidence level,
> and whether it passed, failed, or needs review. Any decision below our confidence
> threshold — currently 60% — routes to REVIEW rather than guessing."

Point to a PASS field and a REVIEW field if any exist.

> "Notice the REVIEW state is first-class. We never force a decision when the
> evidence isn't strong enough."

---

### 2:30 — Summarise and close (30 seconds)

> "The full flow — capture, OCR, rule evaluation, decision — runs in under
> 15 seconds on a real product. The system is extensible: rules are versioned,
> so a rule update doesn't invalidate old inspection reports. And every decision
> is backed by specific image evidence — the inspector and supervisor can always
> see exactly what OCR read and why the system decided what it did."

> "Questions?"

---

## If something goes wrong

| Problem | Fix |
|---|---|
| Submit gives 401 | JWT token expired — log out and log in again before demo |
| Phone can't reach backend | Run `adb reverse tcp:8000 tcp:8000` and restart app |
| OCR takes > 20 seconds | Explain: "First-time model load — subsequent runs are faster" |
| Result shows all REVIEW | Low lighting — move to brighter area, accept the result and explain confidence threshold |
| Backend crash | Show the pre-seeded dashboard data only; skip live capture |
| Dashboard empty | Run `uv run python scripts/seed_demo.py` |

---

## What NOT to say

| Avoid | Say instead |
|---|---|
| "The AI verifies compliance" | "The system assists inspectors in checking declarations" |
| "100% accurate" | "Decisions backed by OCR evidence; uncertain cases go to REVIEW" |
| "It reads Hindi" | "Currently English-only; Hindi support is on our roadmap" |
| "It checks font size" | "Font-size measurement from phone photos is out of scope for this version" |
| "It's production-ready" | "This is a working prototype designed for assisted inspection" |
