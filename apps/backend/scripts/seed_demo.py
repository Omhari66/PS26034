#!/usr/bin/env python
"""
scripts/seed_demo.py — Seed the database with known PASS / FAIL / REVIEW examples
for the SIH demo environment.

Usage:
  cd apps/backend
  uv run python scripts/seed_demo.py

What it creates:
  1. PASS  — Amul Butter 100g (all 5 fields clearly declared)
  2. FAIL  — Generic spice pack (MRP missing, everything else present)
  3. REVIEW — Beverage drink (Consumer Care blurry, low confidence)

Safe to run multiple times — checks for existing demo inspections first.
"""
import asyncio
import json
import sys
import uuid
from datetime import UTC, datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

from sqlalchemy import select

from app.db import AsyncSessionLocal, engine
from app.models import Base, FieldResult, Inspection

DEMO_INSPECTOR_ID = "demo_inspector_001"
RULE_VERSION = "v1.0"

# ---------------------------------------------------------------------------
# Demo inspection definitions
# ---------------------------------------------------------------------------

DEMO_INSPECTIONS = [
    {
        "id": "demo-pass-001",
        "label": "PASS — Amul Butter 100g",
        "category": "packaged_food",
        "overall_decision": "PASS",
        "coverage": {"front": True, "back": True, "close_up": True},
        "fields": [
            {
                "field_name": "mrp",
                "state": "FOUND",
                "value": "55.00",
                "decision": "PASS",
                "confidence": 0.95,
                "reason": "MRP declaration present: Rs.55.00 with sufficient evidence.",
                "bbox": [120, 45, 310, 75],
                "image_role": "front",
            },
            {
                "field_name": "net_quantity",
                "state": "FOUND",
                "value": "100g",
                "decision": "PASS",
                "confidence": 0.92,
                "reason": "Net quantity declared: 100g",
                "bbox": [120, 80, 280, 110],
                "image_role": "front",
            },
            {
                "field_name": "manufacturing_date",
                "state": "FOUND",
                "value": "08/2026",
                "decision": "PASS",
                "confidence": 0.91,
                "reason": "Manufacturing date present: 08/2026",
                "bbox": [80, 140, 260, 165],
                "image_role": "back",
            },
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": "Amul (GCMMF), Anand, Gujarat",
                "decision": "PASS",
                "confidence": 0.93,
                "reason": "Manufacturer/packer identified.",
                "bbox": [60, 180, 320, 225],
                "image_role": "back",
            },
            {
                "field_name": "consumer_care",
                "state": "FOUND",
                "value": "1800-258-3333",
                "decision": "PASS",
                "confidence": 0.90,
                "reason": "Consumer care number found with keyword context.",
                "bbox": [60, 240, 300, 265],
                "image_role": "back",
            },
        ],
    },
    {
        "id": "demo-fail-001",
        "label": "FAIL — Generic spice pack (MRP missing)",
        "category": "packaged_food",
        "overall_decision": "FAIL",
        "coverage": {"front": True, "back": True, "close_up": True},
        "fields": [
            {
                "field_name": "mrp",
                "state": "NOT_FOUND",
                "value": None,
                "decision": "FAIL",
                "confidence": None,
                "reason": "MRP required but not found on any captured panel.",
                "bbox": None,
                "image_role": None,
            },
            {
                "field_name": "net_quantity",
                "state": "FOUND",
                "value": "50g",
                "decision": "PASS",
                "confidence": 0.88,
                "reason": "Net quantity declared: 50g",
                "bbox": [100, 60, 240, 85],
                "image_role": "front",
            },
            {
                "field_name": "manufacturing_date",
                "state": "FOUND",
                "value": "06/2026",
                "decision": "PASS",
                "confidence": 0.87,
                "reason": "Manufacturing date present: 06/2026",
                "bbox": [90, 130, 250, 155],
                "image_role": "back",
            },
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": "MDH Spices Ltd, Delhi",
                "decision": "PASS",
                "confidence": 0.91,
                "reason": "Manufacturer identified.",
                "bbox": [70, 170, 310, 205],
                "image_role": "back",
            },
            {
                "field_name": "consumer_care",
                "state": "FOUND",
                "value": "care@mdhspices.com",
                "decision": "PASS",
                "confidence": 0.89,
                "reason": "Consumer care email found.",
                "bbox": [70, 220, 300, 245],
                "image_role": "back",
            },
        ],
    },
    {
        "id": "demo-review-001",
        "label": "REVIEW — Beverage drink (Consumer Care blurry)",
        "category": "packaged_food",
        "overall_decision": "REVIEW",
        "coverage": {"front": True, "back": True, "close_up": True},
        "fields": [
            {
                "field_name": "mrp",
                "state": "FOUND",
                "value": "30.00",
                "decision": "PASS",
                "confidence": 0.94,
                "reason": "MRP Rs.30.00 present.",
                "bbox": [110, 40, 280, 68],
                "image_role": "front",
            },
            {
                "field_name": "net_quantity",
                "state": "FOUND",
                "value": "200ml",
                "decision": "PASS",
                "confidence": 0.92,
                "reason": "Net quantity declared: 200ml",
                "bbox": [110, 75, 260, 100],
                "image_role": "front",
            },
            {
                "field_name": "manufacturing_date",
                "state": "FOUND",
                "value": "07/2026",
                "decision": "PASS",
                "confidence": 0.90,
                "reason": "Manufacturing date present.",
                "bbox": [85, 135, 245, 158],
                "image_role": "back",
            },
            {
                "field_name": "manufacturer_name",
                "state": "FOUND",
                "value": "Parle Agro Pvt Ltd, Mumbai",
                "decision": "PASS",
                "confidence": 0.91,
                "reason": "Manufacturer identified.",
                "bbox": [65, 175, 305, 210],
                "image_role": "back",
            },
            {
                "field_name": "consumer_care",
                "state": "FOUND",
                "value": "1800-103-1234",
                "decision": "REVIEW",
                "confidence": 0.44,
                "reason": "Consumer care number found but OCR confidence too low (0.44). Please verify from original image.",
                "bbox": [65, 235, 295, 258],
                "image_role": "close_up",
            },
        ],
    },
]


# ---------------------------------------------------------------------------
# Seeding logic
# ---------------------------------------------------------------------------

async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        seeded = 0
        skipped = 0

        for demo in DEMO_INSPECTIONS:
            # Check if already exists
            existing = await session.get(Inspection, demo["id"])
            if existing:
                print(f"  ⏭  Already exists: {demo['label']}")
                skipped += 1
                continue

            insp = Inspection(
                id=demo["id"],
                inspector_id=DEMO_INSPECTOR_ID,
                status="submitted",
                category=demo["category"],
                rule_version=RULE_VERSION,
                overall_decision=demo["overall_decision"],
                coverage=demo["coverage"],
                created_at=datetime.now(UTC),
            )
            session.add(insp)

            for f in demo["fields"]:
                fr = FieldResult(
                    id=str(uuid.uuid4()),
                    inspection_id=demo["id"],
                    field_name=f["field_name"],
                    state=f["state"],
                    extracted_value=f["value"],
                    decision=f["decision"],
                    ocr_confidence=f["confidence"],
                    reason=f["reason"],
                    bbox=f["bbox"],
                    image_role=f["image_role"],
                    rule_id=f"LM-{f['field_name'].upper().replace('_','-')[:3]}-001",
                    rule_version=RULE_VERSION,
                )
                session.add(fr)

            await session.commit()
            print(f"  ✅  Seeded: {demo['label']}")
            seeded += 1

        print(f"\nDone. Seeded: {seeded}  Skipped (already existed): {skipped}")


if __name__ == "__main__":
    asyncio.run(seed())
