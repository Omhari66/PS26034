# 🚀 Developer Onboarding Guide (PS 26034)

Welcome to the team! Before you start coding, you need to set up the project on your local machine and understand our strict Git branching rules.

Follow these steps exactly in order.

---

## Step 1: Clone the Repository

Open your terminal or command prompt and run:

```bash
git clone https://github.com/Omhari66/PS26034.git
cd PS26034
```

---

## Step 2: The Golden Rule of Git (NO PUSHING TO MAIN)

> [!CAUTION]  
> **NEVER write code directly on the `main` branch, and NEVER run `git push origin main`.** 

We use a strict Pull Request workflow to protect the architecture. Before you change a single file, you MUST create a new branch.

**How to start your work:**
```bash
# 1. Make sure your main is up to date
git checkout main
git pull origin main

# 2. Create a new branch named after your feature
# Example: git checkout -b feature/tesseract-ocr
git checkout -b feature/YOUR-FEATURE-NAME
```

When you are done with your code, you will push *your branch* to GitHub and open a Pull Request for the Tech Lead to review:
```bash
git add .
git commit -m "Added my new feature"
git push -u origin feature/YOUR-FEATURE-NAME
```

---

## Step 3: Setup the Backend (Python)

We use a modern `pyproject.toml` setup for Python dependencies. 

Open a terminal in the `PS26034` root folder and run:
```bash
cd apps/backend

# Create a virtual environment
python -m venv .venv

# Activate the virtual environment
# On Windows:
.\.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install all dependencies
pip install -e .[dev]

# Start the Backend Server
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*If everything works, you will see Uvicorn running on `http://0.0.0.0:8000`.*

---

## Step 4: Setup the Mobile App (Expo)

You need Node.js installed for this. Open a **second, brand new terminal window** (leave the backend running in the first one!):

```bash
cd PS26034/apps/mobile

# Install all Javascript dependencies
npm install

# Start the Expo development server
npx expo start
```

> [!TIP]  
> **Testing on a Physical Phone?** 
> If you are using the Expo Go app on your physical Android/iOS device, your phone and computer might have trouble talking to each other over local Wi-Fi. 
> To fix this, stop the server (Ctrl+C) and run: `npx expo start --tunnel`.

---

## Step 5: Start Coding!

Now that you have both the backend and mobile app running, you are ready to look at your assigned tickets on the GitHub Issues board and start writing code on your branch!
