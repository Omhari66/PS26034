# Team Scaling & Optimization Roadmap (PS 26034)

To make this app **"unfoolable"**, we need to transition from "happy path" features (where perfect photos yield perfect results) to **adversarial robustness** (where blurry photos, tricky labels, and missing fields are handled safely). 

Currently, the app lives on your local machine. To scale this up to a 6-person team, we need to divide the remaining work logically, set up a collaborative environment, and establish rules for using AI agents.

---

## Part 1: What’s Left to Build (The "Unfoolable" Roadmap)

Based on our `PHASES.md` and adversarial tests, here are the major gaps we still need to close:

1. **Semantic Extraction (Phase 4)**: Currently, if the OCR sees "₹149", it assumes it's the MRP. But what if it's the "Sale Price" or "Discount"? We need a context-aware scoring system that looks at the words *around* the number (e.g., +5 points if "Maximum Retail Price" is nearby, -5 points if "Offer" is nearby).
2. **Dual-OCR Cross-checking (Phase 3)**: EasyOCR is good, but it makes mistakes. We need to wire up **Tesseract** as a secondary engine. If EasyOCR says "₹199" but Tesseract says "₹299", the system must detect the conflict and flag it as `REVIEW` instead of blindly trusting one.
3. **Hindi Language Support (Phase 3)**: EasyOCR needs to be configured to read `["en", "hi"]` to support bilingual Indian labels, ensuring valid Hindi declarations don't trigger a `FAIL`.
4. **Duplicate Capture Protection (Phase 3)**: An inspector could accidentally upload the front image twice (once as "Front", once as "Back") to bypass coverage rules. We need a perceptual hash (pHash) to warn them if they upload the same image twice.
5. **Data Calibration (Phase 2.5)**: We need 50-100 real photos of Indian FMCG products to test against. We must prove our confidence thresholds (like `0.6`) are based on real data, not guesses.
6. **Dashboard Bounding Boxes (Phase 7/9)**: Supervisors on the web dashboard need to see exactly *where* the AI found the text (bounding box overlays on the image) to quickly verify `REVIEW` fields.

---

## Part 2: Team Assignments (6 Members)

Assign these roles to your teammates. Each person has a clear, isolated domain so they don't step on each other's toes.

### 👤 Member 1: Tech Lead & DevOps (You) - **[Difficulty: Medium]**
- **Your Job**: Set up the GitHub repository, manage pull requests, and oversee Phase 8 (Adversarial Testing) and Phase 9 (Decision Quality Tracking).
- **Your Focus**: Ensuring nobody breaks the strict rules in `AGENTS.md`. You review the code to ensure `evaluate_field()` remains a pure router and that no one is blindly using LLMs to make compliance decisions.

### 📱 Member 2: Mobile App Developer - **[Difficulty: Easy to Medium]**
- **Your Job**: Own the React Native (Expo) app.
- **Your Tasks**: 
  - **[Medium]** Implement duplicate image protection (pHash) on the mobile side before upload.
  - **[Easy]** Implement offline sync failure testing (what happens if the app closes mid-upload?).
  - **[Easy]** Polish the UI/UX of the new Reconcile screen we just built.

### 🤖 Member 3: OCR & ML Engineer - **[Difficulty: Hard]**
- **Your Job**: Own the `apps/backend/app/ocr` directory.
- **Your Tasks**: 
  - **[Easy]** Enable Hindi language detection in EasyOCR (just a config change).
  - **[Hard]** Wire up Tesseract as the secondary engine and implement the `CONFLICTING` logic when the two engines disagree. This is hard because Tesseract requires installing external binaries on the system.

### 🧠 Member 4: Semantic Extraction Engineer - **[Difficulty: Hard]**
- **Your Job**: Own the logic that turns raw OCR text into meaningful data.
- **Your Tasks**: 
  - **[Hard]** Build the ±3 block context window (Phase 4). This requires spatial reasoning (looking at bounding boxes to see which words are near each other) and regex parsing.
  - **[Medium]** Write logic to distinguish "Best Before" from "Manufactured Date", and "Marketed by" from "Manufactured by".

### ⚖️ Member 5: Legal & Compliance Engine - **[Difficulty: Easy but Tedious]**
- **Your Job**: Own `compliance_engine.py` and Phase 2.5 (Calibration).
- **Your Tasks**: 
  - **[Easy/Tedious]** Collect the 50-100 real package photos manually.
  - **[Medium]** Test the deep field validators against adversarial examples (e.g., ensuring a missing Consumer Care number on a fully photographed package actually fails).

### 💻 Member 6: Web Dashboard Developer - **[Difficulty: Medium]**
- **Your Job**: Own the `apps/dashboard` Next.js frontend.
- **Your Tasks**: 
  - **[Medium]** Build the Bounding Box overlay UI so supervisors can see exactly where the OCR found text on the image. (Requires rendering boxes over an image based on JSON coordinates).
  - **[Medium]** Build the Decision Quality Analytics page (showing the % of REVIEWs that supervisors override).

---

## Part 3: How to Work Together (Git & GitHub)

Since you currently have the whole project on your local machine, you need to move it to the cloud so your team can work on it safely.

1. **Create a GitHub Repository**: Go to github.com, create a new private repo named `PS26034`.
2. **Push Your Code**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Core foundations and Phase 3.5"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/PS26034.git
   git push -u origin main
   ```
3. **The Branching Rule (Crucial)**: 
   - **Nobody ever writes code directly on the `main` branch.**
   - When Member 3 wants to add Tesseract, they run: `git checkout -b feature/tesseract-ocr`.
   - When they are done, they push that branch to GitHub and open a **Pull Request (PR)**.
   - You (Member 1) review the PR. If it looks good and passes the adversarial tests (`pytest tests/adversarial`), you merge it into `main`.

---

## Part 3: Branch Protection (Stop Accidental Pushes to `main`)

As the Tech Lead, you must **lock down the `main` branch** on GitHub immediately so nobody (not even you) can accidentally break the app. 

Go to your GitHub repository right now and do this:
1. Click **Settings** (the gear icon at the top).
2. Click **Branches** on the left sidebar.
3. Click **Add branch protection rule**.
4. In the "Branch name pattern" box, type exactly: `main`
5. Check the box that says: **Require a pull request before merging**
   - Check **Require approvals** (set it to at least 1 approval).
6. Check the box that says: **Do not allow bypassing the above settings**
7. Click **Create** at the bottom.

Now, if a teammate accidentally types `git push origin main`, GitHub will reject it! They will be forced to push a branch and open a Pull Request.

---

## Part 4: Onboarding Guide for Team Members (Start Here!)

When your teammates join the project, give them these exact steps to get their machine set up:

### 1. Clone the Code
```bash
git clone https://github.com/Omhari66/PS26034.git
cd PS26034
```

### 2. Set up the Backend (Python)
They need Python installed on their computer.
```bash
cd apps/backend
python -m venv .venv

# On Windows:
.\.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install the dependencies from pyproject.toml
pip install -e .[dev]

python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Set up the Mobile App (Expo)
They need Node.js installed on their computer. Open a **second terminal window**:
```bash
cd apps/mobile
npm install
npx expo start
```
*Tip: If testing on a physical phone, remind them to use `npx expo start --tunnel`!*

### 4. Create a Branch for Your Task
Before changing any code, they must create a branch. Tell them to name it based on their role:
```bash
# E.g., for Member 3 adding Tesseract
git checkout -b feature/tesseract-ocr
```

### 5. Push and Open a Pull Request
When they are done writing code and testing it locally:
```bash
git add .
git commit -m "Added Tesseract OCR fallback"
git push -u origin feature/tesseract-ocr
```
Then, they go to GitHub.com, click "Compare & pull request", and wait for you to review it!

---

## Part 5: The Tech Lead Playbook (How to Assign Tasks like a Pro)

In real software companies, you don't just say "build Tesseract" to an engineer. You write a **Ticket** (usually in GitHub Issues, Jira, or Trello). A good ticket removes all ambiguity so the developer knows exactly *what* to build and *when* they are done.

As the Lead, you should write a ticket for every task. Every ticket should have 4 parts:
1. **User Story (The Why):** Why are we building this?
2. **Acceptance Criteria (The Contract):** A checklist of what MUST work to consider the task "Done".
3. **Technical Context:** Where should they look in the code?
4. **Testing Instructions:** How do they prove it works?

### Example Ticket (Give this to Member 3 for Tesseract):

**Title:** Wire up Tesseract as a Secondary OCR Cross-check
**Assignee:** Member 3

**1. User Story**
As an inspector, I want the system to cross-check EasyOCR against Tesseract so that if EasyOCR makes a mistake reading the MRP, the system catches the conflict instead of blindly passing it.

**2. Acceptance Criteria (Definition of Done)**
- [ ] Tesseract OCR engine is integrated into the backend.
- [ ] If EasyOCR and Tesseract extract different values for the same field, the field state is set to `CONFLICTING`.
- [ ] `evaluate_field()` routes `CONFLICTING` to a `REVIEW` outcome.
- [ ] If Tesseract fails to run or isn't installed, the field is marked `single_engine_only=True` and capped at `REVIEW`.
- [ ] Adversarial Test #5 and #8 pass successfully.

**3. Technical Context**
- The OCR engines live in `apps/backend/app/ocr/engines/`.
- We already have a base class. You need to implement `tesseract_engine.py`.
- Look at `apps/backend/app/ocr/pipeline.py` to see where the cross-checking logic should go.

**4. Testing Instructions**
- Run `pytest apps/backend/tests/adversarial/test_ps26034_failures.py`.
- You cannot merge this PR until Tests 5 and 8 are green.

*(By writing tasks like this, your teammates will never be confused about what file to edit or how to prove their code works!)*

### How to Review a Pull Request (Your Job as Lead)
When your teammate finishes their code, they will open a Pull Request (PR) on GitHub. Here is exactly what you do next:

1. **Go to the "Pull Requests" tab** on GitHub and click on their PR.
2. **Review the Code:** Click the **"Files changed"** tab. You will see their additions in green and deletions in red. Look at their code and make sure they didn't break any rules from `AGENTS.md`.
3. **Test it Locally (Important!):** Before trusting their code, test it on your own machine. Open your terminal and run:
   ```bash
   # Pull their branch to your computer
   git fetch origin
   git checkout feature/their-branch-name
   
   # Run the adversarial tests to make sure they didn't break the compliance rules
   cd apps/backend
   pytest tests/adversarial/test_ps26034_failures.py
   ```
4. **Make a Decision:** Go back to GitHub. Click the green **Review changes** button at the top right.
   - If the code is bad or fails tests: Select **Request changes**, write a comment explaining what they did wrong, and click Submit. (They will have to fix it and push again).
   - If the code is good and tests pass: Select **Approve**, click Submit, and then click the giant green **Merge pull request** button! 

Once you click Merge, their code is officially added to `main`!

---

## Part 6: Guide to Using AI Agents for the Team

Your teammates will likely use AI agents (like this one) to help them write code. Give them these strict rules to prevent the AI from destroying the architecture:

> [!IMPORTANT]  
> **The 4 Rules for Teammates Using AI Agents**

1. **Always Provide the Law**: Before asking an AI to write code, tell it to read `AGENTS.md`, `PHASES.md`, and `CONTRACTS.md`. If the AI doesn't know the rules, it *will* hallucinate features (like adding an LLM to guess the price) that violate our strict compliance engine.
2. **Never Let AI "Fix" the Tests**: If an AI writes code that breaks one of our 10 Adversarial Tests (`test_ps26034_failures.py`), **do not let the AI rewrite the test to make it pass.** The tests are the ground truth. The AI must fix the code to satisfy the test.
3. **One Phase at a Time**: Tell the AI exactly which phase you are working on. Do not let it "refactor" the whole backend when you only asked it to fix a button on the frontend.
4. **No Silent Fallbacks**: If the AI doesn't know how to do something (e.g., integrate Tesseract), tell it to leave a `# TODO(stub): integrate tesseract here` comment. **Never** let the AI silently fake a feature just to make the code compile.
