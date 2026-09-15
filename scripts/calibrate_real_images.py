from __future__ import annotations

import glob
import json
import os
import sys
from pathlib import Path

# Set stdout to UTF-8
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

_REPO_ROOT = Path(__file__).resolve().parents[1]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))
_SHARED_SCHEMA_PATH = _REPO_ROOT / "packages" / "shared-schema"
if str(_SHARED_SCHEMA_PATH) not in sys.path:
    sys.path.insert(0, str(_SHARED_SCHEMA_PATH))
_BACKEND_PATH = _REPO_ROOT / "apps" / "backend"
if str(_BACKEND_PATH) not in sys.path:
    sys.path.insert(0, str(_BACKEND_PATH))

from PIL import Image
import numpy as np

from compliance_engine import (
    CONF_THRESHOLD,
    Decision,
    EvidenceState,
    FieldEvidence,
    evaluate_field,
)
from app.ocr.engines.base import OCRResult
from app.ocr.field_extractor import extract_field

RULE_MAP = {
    "mrp": "LM-MRP-001",
    "net_quantity": "LM-NQ-001",
    "manufacturing_date": "LM-MD-001",
    "manufacturer_name": "LM-MN-001",
    "consumer_care": "LM-CC-001",
}


def main():
    gt_file = _REPO_ROOT / "data" / "calibration" / "ground_truth.json"
    with open(gt_file, "r", encoding="utf-8") as f:
        gt_data = json.load(f)

    gt_samples = {s["sample_id"]: s for s in gt_data.get("samples", [])}

    print("================================================================================")
    print("PS 26034: REAL PACKAGING CALIBRATION & OCR VERIFICATION RUN")
    print(f"Confidence Threshold: {CONF_THRESHOLD:.2f} | False-PASS Target: 0.0%")
    print("================================================================================")

    import easyocr
    reader = easyocr.Reader(["en"], gpu=False, verbose=False)

    results_by_pkg = {}
    pkg_list = [f"PKG-00{i}" for i in range(1, 9)]

    for pkg_id in pkg_list:
        sample_info = gt_samples.get(pkg_id, {})
        brand = sample_info.get("brand", "Unknown")
        product = sample_info.get("product_name", "Unknown")
        gt = sample_info.get("ground_truth", {})

        imgs = sorted(glob.glob(str(_REPO_ROOT / "data" / "calibration" / "images" / f"{pkg_id}_*.jpg")))
        imgs = [x for x in imgs if not x.endswith(".jpg.jpg")]

        print(f"\n[{pkg_id}] {brand} - {product}")
        print(f"  Images: {[os.path.basename(x) for x in imgs]}")

        ocr_results = []
        for img_path in imgs:
            im = Image.open(img_path).convert("RGB")
            im.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
            arr = np.array(im)
            raw = reader.readtext(arr)
            for poly, text, conf in raw:
                text_clean = text.strip()
                if text_clean:
                    xs = [int(p[0]) for p in poly]
                    ys = [int(p[1]) for p in poly]
                    bbox = (min(xs), min(ys), max(xs), max(ys))
                    ocr_results.append(OCRResult(text=text_clean, bbox=bbox, confidence=float(conf), engine_name="easyocr"))

        print(f"  Detected {len(ocr_results)} OCR text lines.")

        coverage = {"front": True, "back": True}
        field_evaluations = {}

        for field_name, rule_id in RULE_MAP.items():
            ext = extract_field(field_name, ocr_results)
            expected = gt.get(field_name) or (gt.get("manufacturer") if field_name == "manufacturer_name" else None)

            if ext is not None:
                ev = FieldEvidence(
                    field_name=field_name,
                    state=EvidenceState.FOUND,
                    value=ext.normalized_value,
                    ocr_confidence=ext.source_result.confidence,
                )
            else:
                ev = FieldEvidence(
                    field_name=field_name,
                    state=EvidenceState.NOT_FOUND,
                    ocr_confidence=0.0,
                )

            decision_res = evaluate_field(ev, rule_id, "v1.0", required=True, coverage=coverage)
            field_evaluations[field_name] = {
                "decision": decision_res.decision.value,
                "extracted": ext.normalized_value if ext else None,
                "expected": expected,
                "confidence": ext.source_result.confidence if ext else 0.0,
                "reason": decision_res.reason,
            }

            status_icon = "PASS" if decision_res.decision == Decision.PASS else decision_res.decision.value
            print(f"    - {field_name.ljust(18)}: [{status_icon.center(6)}] Extracted: {str(field_evaluations[field_name]['extracted'])[:25]} | Expected: {str(expected)[:25]}")

        results_by_pkg[pkg_id] = field_evaluations

    print("\n================================================================================")
    print("CALIBRATION SUMMARY ON USER UPLOADED REAL IMAGES")
    print("================================================================================")
    for pkg_id, evals in results_by_pkg.items():
        passes = sum(1 for v in evals.values() if v["decision"] == "PASS")
        fails = sum(1 for v in evals.values() if v["decision"] == "FAIL")
        reviews = sum(1 for v in evals.values() if v["decision"] == "REVIEW")
        print(f"{pkg_id}: PASS={passes}/5, REVIEW={reviews}/5, FAIL={fails}/5")


if __name__ == "__main__":
    main()
