# Industry-Standard GitHub Workflow Guide

This document outlines the professional GitHub workflow used in the industry to ensure high code quality, prevent bugs, and enable seamless collaboration. Following this guide will protect the `main` branch and make everyone a stronger software engineer.

---

## 1. The Contributor Workflow (For Teammates)

As a contributor, your job is to build features or fix bugs in an isolated environment and present your finished work for review. **Never commit directly to the `main` branch.**

### Step 1: Keep Your Local Repository Updated
Before you start any new work, always make sure you are up-to-date with what the rest of the team has done.
```bash
git checkout main
git fetch origin main
git reset --hard origin/main
git clean -fd
```
*(This ensures you don't accidentally start building on top of outdated or broken code.)*

### Step 2: Create a Feature Branch
Create a new branch for your specific task. Use a clear, descriptive name.
```bash
# Good examples: feature/dashboard-analytics, fix/login-crash
git checkout -b feature/your-feature-name
```

### Step 3: Write Code and Commit Often
As you build, commit your changes in small, logical chunks (atomic commits). This makes it much easier for the reviewer to understand what you did.
```bash
git add .
git commit -m "Add coordinate extraction to OCR engine"
```
*Industry Tip:* Commit messages should complete the sentence: "If applied, this commit will..." (e.g., "...Add coordinate extraction").

### Step 4: Push and Open a Pull Request (PR)
When your feature is complete, push it to GitHub and open a PR against `main`.
```bash
git push origin feature/your-feature-name
```
- Go to GitHub, click "Compare & pull request".
- Write a clear description of what the PR does and link to any relevant tickets.

### Step 5: Wait for CI and Address Feedback
- **CI Pipeline:** GitHub will automatically run tests (the green/red checks). If they fail, fix the errors locally, commit, and push again. The PR will update automatically.
- **Review:** The Code Owner will review your PR. If they request changes, make the fixes on your local branch and push them up. Do not close the PR and open a new one!

---

## 2. The Code Owner Workflow (For the Reviewer / Lead)

As the Code Owner, your job is to guard the `main` branch. Your priority is code safety, architecture integrity, and enforcing the rules defined in `AGENTS.md`.

### Step 1: Check the CI Pipeline
When a new PR comes in, look at the automated checks at the bottom.
- **Red X:** The code is broken or fails type/lint checks. **Stop.** Tell the contributor to fix it.
- **Green Check:** The code compiles and tests pass. Proceed to review.

### Step 2: Review the Code Architecture
Do not blindly merge code just because it has no conflicts.
1. **Leverage AI:** You can ask the AI assistant: *"Review PR #12. Check if it violates AGENTS.md, invents evidence, or bypasses the rule engine."*
2. **Verify Contracts:** Ensure the PR stays within its module boundaries (e.g., the mobile app shouldn't be making database queries directly).

### Step 3: Request Changes or Approve
- If you find issues or if the AI flags a rule violation, click **"Request Changes"** and leave clear comments explaining what needs to be fixed.
- If the code is solid, click **"Approve"**.

### Step 4: Merge
Only merge when:
1. CI is green ✅
2. The code has been reviewed and approved ✅
3. There are no merge conflicts ✅

---

## 3. How to Handle Merge Conflicts

Merge conflicts happen when two people edit the exact same lines of code, and Git doesn't know whose version to keep. 

### If you are the Contributor:
If your PR shows conflicts, you must resolve them by pulling the latest `main` into your branch.
```bash
# 1. Make sure your local main is updated
git checkout main
git pull origin main

# 2. Go back to your feature branch
git checkout feature/your-feature-name

# 3. Merge main into your branch
git merge main
```
Git will pause the merge and show you the conflicting files. 
- Open those files in VS Code. 
- Look for `<<<<<<< HEAD` and `>>>>>>> main`. 
- Choose which code to keep, save the file, and then run:
```bash
git add .
git commit -m "Resolve merge conflicts with main"
git push origin feature/your-feature-name
```

### If you are the Code Owner:
If a PR is highly complex or resulted from massive structural changes (like moving a submodule), ask the AI assistant to resolve the conflicts safely rather than risking the contributor deleting important structural code.
