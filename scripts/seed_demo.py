#!/usr/bin/env python3
"""
seed_demo.py -- idempotent demo data seeder for PS 26034.

Creates three inspections in the running backend:
  1. PASS  -- packaged_food: all 5 fields found with high confidence
  2. FAIL  -- packaged_food: MRP sticker missing (NOT_FOUND)
  3. REVIEW -- packaged_food: MRP conflicting readings (scanner vs label)

Then adds a supervisor review to the REVIEW inspection to demonstrate
the full audit trail flow.

Usage:
    # Make sure the backend is running first:
    #   cd apps/backend && uv run uvicorn main:app --reload

    python scripts/seed_demo.py [--url http://localhost:8000]

    # Re-running is safe -- uses idempotency tag in inspector_id to
    # detect existing seeds and skip them.

Idempotency: checks GET /api/v1/inspections?inspector_id=SEED_<label>
before creating. Safe to run repeatedly.
"""

import argparse
import json
import sys
import urllib.request
from datetime import datetime

# -- Config -------------------------------------------------------------------

SUPERVISOR_EMAIL = "supervisor@demo.ps26034"
SUPERVISOR_PASSWORD = "supervisor123"
INSPECTOR_EMAIL = "inspector@demo.ps26034"
INSPECTOR_PASSWORD = "inspector123"

DEMO_SCENARIOS = [
    {
        "label": "PASS",
        "inspector_id": "SEED_PASS_demo_inspector",
        "category": "packaged_food",
        "coverage": {"front": True, "back": True, "close_up": True},
        "field_evidences": [
            {
                "field_name": "mrp",
                "state": "FOUND",
                "value": "149.00",
                "ocr_confidence": 0.97,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "bbox": [120, 340, 280, 380],
                "image_quality": "high",
            },
            {
                "field_name": "net_quantity",
                "state": "FOUND",
                "value": "500g",
                "ocr_confidence": 0.95,
                "ocr_engine": "easyocr",
                "source_image": "back.jpg",
                "bbox": [80, 200, 200, 240],
                "image_quality": "high",
            },
            {
                "field_name": "manufacturing_date",
                "state": "FOUND",
                "value": "MAR 2025",
                "ocr_confidence": 0.93,
                "ocr_engine": "easyocr",
                "source_image": "back.jpg",
                "bbox": [300, 410, 480, 450],
                "image_quality": "high",
            },
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": "ACME Foods Pvt Ltd",
                "ocr_confidence": 0.96,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "bbox": [60, 50, 400, 90],
                "image_quality": "high",
            },
            {
                "field_name": "consumer_care",
                "state": "FOUND",
                "value": "1800-111-2222",
                "ocr_confidence": 0.91,
                "ocr_engine": "easyocr",
                "source_image": "back.jpg",
                "bbox": [60, 500, 300, 535],
                "image_quality": "high",
            },
        ],
    },
    {
        "label": "FAIL",
        "inspector_id": "SEED_FAIL_demo_inspector",
        "category": "packaged_food",
        "coverage": {"front": True, "back": True, "close_up": False},
        "field_evidences": [
            {
                "field_name": "mrp",
                "state": "NOT_FOUND",
                "value": None,
                "ocr_confidence": None,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "image_quality": "high",
            },
            {
                "field_name": "net_quantity",
                "state": "FOUND",
                "value": "250g",
                "ocr_confidence": 0.94,
                "ocr_engine": "easyocr",
                "source_image": "back.jpg",
                "bbox": [100, 220, 210, 255],
                "image_quality": "high",
            },
            {
                "field_name": "manufacturing_date",
                "state": "FOUND",
                "value": "JAN 2025",
                "ocr_confidence": 0.88,
                "ocr_engine": "easyocr",
                "source_image": "back.jpg",
                "bbox": [300, 400, 460, 440],
                "image_quality": "medium",
            },
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": "Sunrise Industries",
                "ocr_confidence": 0.92,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "bbox": [50, 60, 380, 100],
                "image_quality": "high",
            },
            {
                "field_name": "consumer_care",
                "state": "NOT_FOUND",
                "value": None,
                "ocr_confidence": None,
                "ocr_engine": "easyocr",
                "source_image": "back.jpg",
                "image_quality": "medium",
            },
        ],
    },
    {
        "label": "REVIEW",
        "inspector_id": "SEED_REVIEW_demo_inspector",
        "category": "packaged_food",
        "coverage": {"front": True, "back": False, "close_up": True},
        "field_evidences": [
            {
                "field_name": "mrp",
                "state": "CONFLICTING",
                "value": "149.00",
                "ocr_confidence": 0.71,
                "ocr_engine": "easyocr",
                "source_image": "close_up.jpg",
                "bbox": [90, 310, 260, 350],
                "image_quality": "medium",
            },
            {
                "field_name": "net_quantity",
                "state": "FOUND",
                "value": "1kg",
                "ocr_confidence": 0.89,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "bbox": [110, 190, 220, 225],
                "image_quality": "high",
            },
            {
                "field_name": "manufacturing_date",
                "state": "NOT_VERIFIABLE",
                "value": None,
                "ocr_confidence": 0.41,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "image_quality": "low",
            },
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": "Bharat Spices Ltd",
                "ocr_confidence": 0.90,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "bbox": [55, 45, 390, 85],
                "image_quality": "high",
            },
            {
                "field_name": "consumer_care",
                "state": "FOUND",
                "value": "support@bharatspices.in",
                "ocr_confidence": 0.86,
                "ocr_engine": "easyocr",
                "source_image": "front.jpg",
                "bbox": [60, 490, 320, 525],
                "image_quality": "high",
            },
        ],
    },
]


# -- Helpers ------------------------------------------------------------------


def _request(method: str, url: str, body=None, token: str | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body_bytes = e.read()
        print(f"  HTTP {e.code}: {body_bytes.decode()[:300]}", file=sys.stderr)
        raise


def login_user(base: str, email: str, password: str) -> str:
    resp = _request("POST", f"{base}/auth/login", {"email": email, "password": password})
    return resp["token"]


def already_seeded(base: str, inspector_id: str, token: str) -> str | None:
    """Return inspection_id if this seed already exists, else None."""
    resp = _request("GET", f"{base}/inspections?inspector_id={inspector_id}", token=token)
    items = resp.get("items", [])
    submitted = [i for i in items if i["status"] == "submitted"]
    return submitted[0]["inspection_id"] if submitted else None


# -- Main ---------------------------------------------------------------------


def seed(base: str) -> None:
    api = f"{base}/api/v1"
    sep = "=" * 60
    print(f"\n{sep}")
    print(f"PS 26034 demo seeder -- {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Target: {base}")
    print(sep)

    # Login as both roles
    print("\n[1/4] Authenticating...")
    inspector_token = login_user(api, INSPECTOR_EMAIL, INSPECTOR_PASSWORD)
    supervisor_token = login_user(api, SUPERVISOR_EMAIL, SUPERVISOR_PASSWORD)
    print("  OK  inspector token obtained")
    print("  OK  supervisor token obtained")

    seeded_ids: dict[str, str] = {}  # label -> inspection_id

    print("\n[2/4] Seeding inspections...")
    for scenario in DEMO_SCENARIOS:
        label = scenario["label"]
        iid = already_seeded(api, scenario["inspector_id"], inspector_token)
        if iid:
            print(f"  SKIP {label}: already seeded ({iid[:8]}...) -- skipping")
            seeded_ids[label] = iid
            continue

        # Create
        resp = _request(
            "POST", f"{api}/inspections",
            {"inspector_id": scenario["inspector_id"]},
            token=inspector_token,
        )
        iid = resp["inspection_id"]

        # Set category
        _request(
            "POST", f"{api}/inspections/{iid}/category",
            {"category": scenario["category"]},
            token=inspector_token,
        )

        # Submit
        result = _request(
            "POST", f"{api}/inspections/{iid}/submit",
            {
                "coverage": scenario["coverage"],
                "field_evidences": scenario["field_evidences"],
            },
            token=inspector_token,
        )
        decision = result["overall_decision"]
        print(f"  OK   {label}: {iid[:8]}... -> {decision}")

        # Warn if decision doesn't match expected label
        if decision != label:
            print(f"  WARN Expected {label} but got {decision} -- check rule table.")

        seeded_ids[label] = iid

    # Supervisor review on the REVIEW inspection
    print("\n[3/4] Adding supervisor review to REVIEW case...")
    review_id = seeded_ids.get("REVIEW")
    if review_id:
        audit = _request("GET", f"{api}/inspections/{review_id}/audit", token=supervisor_token)
        if audit.get("reviews"):
            print("  SKIP Supervisor review already exists -- skipping")
        else:
            _request(
                "POST", f"{api}/inspections/{review_id}/review",
                {
                    "overridden_decision": "FAIL",
                    "reason": (
                        "Physical inspection confirms MRP sticker is torn and "
                        "unreadable. OCR conflict was correct to route to REVIEW. "
                        "Overriding to FAIL after on-site verification."
                    ),
                    "reviewer_id": SUPERVISOR_EMAIL,
                },
                token=supervisor_token,
            )
            print("  OK   Supervisor override recorded (REVIEW -> FAIL)")

    print("\n[4/4] Summary")
    print(f"  PASS   inspection_id: {seeded_ids.get('PASS', 'n/a')}")
    print(f"  FAIL   inspection_id: {seeded_ids.get('FAIL', 'n/a')}")
    print(f"  REVIEW inspection_id: {seeded_ids.get('REVIEW', 'n/a')}")

    print(f"\n{sep}")
    print("  Demo data ready. Open the dashboard to verify:")
    print("  -> http://localhost:3000")
    print("  -> http://localhost:3000/review")
    print(f"{sep}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed PS 26034 demo data")
    parser.add_argument(
        "--url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    args = parser.parse_args()
    try:
        seed(args.url)
    except Exception as e:
        print(f"\nFAIL Seeding failed: {e}", file=sys.stderr)
        sys.exit(1)
