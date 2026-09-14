# GitHub Issues Backlog 

## 📱 Mobile App (Assign to: Arpan & Omkar)

### Ticket 1: Implement Duplicate Image Protection (pHash)
**Title:** Mobile: Prevent duplicate image uploads using pHash
**Assignees:** Arpan & Omkar

**1. User Story**
As a supervisor, I want to ensure the inspector isn't uploading the exact same photo twice (e.g., uploading the front panel as both "Front" and "Back") so that we guarantee complete coverage of the package.

**2. Acceptance Criteria**
- [ ] Calculate a perceptual hash (pHash) of the image immediately after it is captured or picked.
- [ ] Before allowing the user to assign a role to the image, compare its hash against already captured images in the current session.
- [ ] If similarity is >95%, show a warning `Alert` blocking the upload and forcing a retake.
- [ ] Tested on device by taking two identical photos.

**3. Technical Context**
- Look in `apps/mobile/app/capture.tsx` inside the `handleCapture` function.
- You may need to install a lightweight hashing library compatible with Expo/React Native or write a basic pixel-diffing utility.

**4. Testing Instructions**
- Take a photo of the front of a package.
- Try to take the exact same photo for the "Back" slot. The app must block it.

---

### Ticket 2: Offline Sync Failure Handling
**Title:** Mobile: Graceful failure handling for offline syncs
**Assignees:** Arpan & Omkar

**1. User Story**
As an inspector operating in a poor network area, I want the app to handle connection drops gracefully so I don't lose my inspection data or get stuck on a loading screen forever.

**2. Acceptance Criteria**
- [ ] If the `/analyze` or `/submit` API calls fail due to network timeout, show a clear, user-friendly error message.
- [ ] The app must not crash if the user force-closes it while an upload is happening.
- [ ] Implement a "Retry" button on the UI if the submission fails.

**3. Technical Context**
- Review `apps/mobile/app/submit.tsx` and `apps/mobile/lib/api.ts`.
- Ensure the `catch` blocks of your API promises actually update the UI state instead of just logging to the console.

**4. Testing Instructions**
- Start an inspection on your phone.
- Turn on Airplane Mode right before clicking "Analyze Inspection".
- Verify the UI shows a clean error and allows you to retry once connection is restored.

---

### Ticket 3: UI/UX Polish for the Reconcile Screen
**Title:** Mobile: Polish the Reconcile Screen UI/UX
**Assignees:** Arpan & Omkar

**1. User Story**
As an inspector, I want the Reconcile Screen to be highly intuitive and visually polished so I can quickly resolve AI uncertainties without feeling overwhelmed by text.

**2. Acceptance Criteria**
- [ ] Improve spacing, padding, and typography on `app/reconcile.tsx`.
- [ ] Make the "Confirm AI", "Correct", and "Mark Absent" buttons look distinct (e.g., color-coded).
- [ ] Ensure the Category Mismatch warning box is prominent (yellow/orange alert style).

**3. Technical Context**
- You will be working entirely in `apps/mobile/app/reconcile.tsx`.
- Use the design tokens in `apps/mobile/constants/colors.ts`.

**4. Testing Instructions**
- Run the app via Expo, trigger an inspection that results in a `REVIEW` state, and ensure the screen looks premium on both iOS and Android emulators.

---

## 🤖 OCR & ML (Assign to: Anshu)

### Ticket 4: Enable Hindi Language Detection
**Title:** Backend: Enable Hindi Language Detection in EasyOCR
**Assignee:** Anshu

**1. User Story**
As an inspector, I want the AI to read Hindi text on packaging so that products with bilingual labels aren't falsely flagged as non-compliant.

**2. Acceptance Criteria**
- [ ] EasyOCR is initialized with `['en', 'hi']`.
- [ ] The engine correctly extracts Hindi text without crashing.
- [ ] Adversarial Test #9 (Hindi-only declaration) passes.

**3. Technical Context**
- Edit `apps/backend/app/ocr/engines/easyocr_engine.py`.
- Find where `easyocr.Reader` is initialized and update the language list.

**4. Testing Instructions**
- Run `pytest apps/backend/tests/adversarial/test_ps26034_failures.py`.

---

### Ticket 5: Tesseract Secondary Engine Integration
**Title:** Backend: Wire up Tesseract as secondary cross-check
**Assignee:** Anshu

**1. User Story**
As a supervisor, I want the system to cross-check EasyOCR against Tesseract so that if one makes a mistake reading critical data, the conflict is caught and sent to manual REVIEW.

**2. Acceptance Criteria**
- [ ] Tesseract OCR engine is integrated via `pytesseract`.
- [ ] If EasyOCR and Tesseract extract different values, set the field state to `CONFLICTING`.
- [ ] If Tesseract fails to run, set `single_engine_only=True` and cap the field at `REVIEW`.
- [ ] Adversarial Test #5 and #8 pass successfully.

**3. Technical Context**
- Implement `apps/backend/app/ocr/engines/tesseract_engine.py`.
- Update `apps/backend/app/ocr/pipeline.py` to run both engines and compare their outputs.

**4. Testing Instructions**
- Ensure you have Tesseract installed on your OS before testing.
- Run `pytest apps/backend/tests/adversarial/test_ps26034_failures.py`.

---

## 🧠 Semantic Extraction (Assign to: Adeeb)

### Ticket 6: Build the ±3 Block Context Window
**Title:** Backend: Implement spatial context window (±3 blocks) for Semantic Extraction
**Assignee:** Adeeb

**1. User Story**
As a legal compliance engine, I need to know if the number "149" is actually the MRP, or if it's a discount or weight. I need context around the number.

**2. Acceptance Criteria**
- [ ] For any monetary candidate found by OCR, find the 3 OCR blocks closest to it.
- [ ] Assign a score: +5 if "MRP" or "Maximum Retail Price" is nearby, -5 if "Offer" or "Sale" is nearby.
- [ ] If score is high, classify as MRP. If ambiguous, classify as `REVIEW`.
- [ ] Adversarial Test #1 and #2 pass.

**3. Technical Context**
- You are replacing the dumb Regex logic in `apps/backend/app/ocr/field_extractor.py`.
- You will need to use bounding box coordinates (`bbox`) to calculate visual distance between text blocks.

**4. Testing Instructions**
- Run `pytest apps/backend/tests/adversarial/test_ps26034_failures.py`.

---

### Ticket 7: Semantic Logic for Dates and Manufacturers
**Title:** Backend: Distinguish Date and Manufacturer types
**Assignee:** Adeeb

**1. User Story**
As an inspector, I need the system to understand the difference between a Manufacturing Date and an Expiry Date, otherwise compliant packages will fail.

**2. Acceptance Criteria**
- [ ] The extractor correctly distinguishes "MFD/PKD" from "BBD/Expiry".
- [ ] The extractor correctly distinguishes "Manufactured by" from "Marketed by".
- [ ] Adversarial Test #6 and #7 pass.

**3. Technical Context**
- Work in `apps/backend/app/ocr/field_extractor.py`.
- Look for keywords like "Mfd", "Pkd", "Best Before", "Use By".

**4. Testing Instructions**
- Run `pytest apps/backend/tests/adversarial/test_ps26034_failures.py`.

---

## ⚖️ Legal & Compliance (Assign to: Rehman)

### Ticket 8: Collect Calibration Dataset
**Title:** Data: Collect 50-100 real package photos for calibration
**Assignee:** Rehman

**1. User Story**
As a data scientist, I need a ground-truth dataset of real Indian packages so I can prove that our AI's confidence thresholds are accurate and not just random guesses.

**2. Acceptance Criteria**
- [ ] Capture or source 50-100 high-quality images of FMCG packages (Food, Cosmetics, etc).
- [ ] Include tricky edge cases: blurry photos, multiple prices, Hindi labels.
- [ ] Manually annotate what the "true" values are in a spreadsheet.
- [ ] Upload images to a shared drive or `data/calibration/` folder (DO NOT commit large images directly to git).

**3. Technical Context**
- This is a non-coding task. You are building the dataset that Anshu and Adeeb will use to test their algorithms.

**4. Testing Instructions**
- Share the final spreadsheet and image folder link with the team.

---

### Ticket 9: Test Deep Field Validators
**Title:** Backend: Validate compliance logic against adversarial edge cases
**Assignee:** Rehman

**1. User Story**
As a legal expert, I want to ensure that if a mandatory field (like Consumer Care) is missing from a perfectly captured photo, the system explicitly FAILS the package.

**2. Acceptance Criteria**
- [ ] Write logic inside the validator functions to ensure `NOT_FOUND` + complete coverage (front & back captured) = `FAIL`.
- [ ] `NOT_FOUND` + incomplete coverage = `REVIEW`.
- [ ] All 10 Adversarial Tests in the test suite pass.

**3. Technical Context**
- You own `packages/shared-schema/compliance_engine.py`.
- Look at the `validate_*` functions. Remember, the engine is a pure router—no LLMs allowed here!

**4. Testing Instructions**
- Run `pytest apps/backend/tests/adversarial/test_ps26034_failures.py`.

---

## 💻 Web Dashboard (Assign to: Omkar Dubey)

### Ticket 10: Bounding Box Overlay UI
**Title:** Frontend: Build Bounding Box Overlay for Evidence Viewer
**Assignee:** Omkar Dubey

**1. User Story**
As a supervisor reviewing a flagged package on the web dashboard, I want to see exactly where the AI detected the text on the image so I don't have to squint and search the image myself.

**2. Acceptance Criteria**
- [ ] When viewing an inspection on the dashboard, the package image is displayed.
- [ ] Draw a colored box over the image using the `bbox` coordinates returned in the OCR JSON.
- [ ] The boxes should scale correctly regardless of the user's screen size.

**3. Technical Context**
- Work in `apps/dashboard/app/review/page.tsx` or create a new `EvidenceViewer` component.
- The `bbox` format from EasyOCR is usually `[[x1,y1], [x2,y1], [x2,y2], [x1,y2]]`.
- You will need to map these coordinates to CSS absolute positioning over an HTML `<img />` or `<canvas>`.

**4. Testing Instructions**
- Run the Next.js app (`npm run dev` in `apps/dashboard`).
- Open an inspection that has OCR data and verify the box perfectly highlights the text.

---

### Ticket 11: Decision Quality Analytics Page
**Title:** Frontend: Build Decision Quality Analytics Page
**Assignee:** Omkar Dubey

**1. User Story**
As a manager, I want a dashboard page that shows me how often the AI is getting things wrong, so I can see if our system is improving over time.

**2. Acceptance Criteria**
- [ ] Create a new route (e.g., `/dashboard/analytics`).
- [ ] Display the total % of inspections that landed in `REVIEW` this week.
- [ ] Display the % of `REVIEW` items that were overridden by supervisors vs confirmed.
- [ ] Identify which specific field (e.g., MRP, Mfg Date) causes the most `REVIEW` outcomes.

**3. Technical Context**
- Work in `apps/dashboard`.
- You will need to fetch data from the backend. (You may need to ask the Backend team to create a `/stats` endpoint for you).

**4. Testing Instructions**
- Run the frontend, navigate to the Analytics page, and ensure the UI looks clean (use charts if possible, like Chart.js or Recharts).
