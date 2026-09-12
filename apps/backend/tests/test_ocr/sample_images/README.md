# Sample images for Phase 2 DoD verification

## Phase 2 Definition of Done

> "feeding a real photo of a real product through the pipeline produces evidence
> that matches manual inspection, for at least 10 hand-checked sample images."

## How to run the verification

1. Place 10+ JPEG/PNG photos of real packaged products in this directory.
   - Name them `001_product_name_role.jpg` (e.g. `001_biscuits_front.jpg`)
   - Each image should cover one role: `front`, `back`, or `close_up`

2. Create a companion `samples.json` describing what you expect to find:

```json
[
  {
    "filename": "001_biscuits_front.jpg",
    "role": "front",
    "expected": {
      "mrp": "30.00",
      "net_quantity": "100g",
      "manufacturing_date": "Jan 2025",
      "manufacturer_name": "Britannia Industries Ltd",
      "consumer_care": "1800-103-1234"
    }
  }
]
```

3. Run the verification script (TODO: create `scripts/verify_pipeline.py`):

```powershell
cd apps/backend
uv run python scripts/verify_pipeline.py tests/test_ocr/sample_images/
```

4. Inspect the generated `verification_report.json` and manually confirm that
   each extracted value matches the product label.

## Notes

- PaddleOCR is not available on Python 3.14 (no wheel). EasyOCR is used.
- Cross-check uses a zoomed-crop second EasyOCR pass.
- Fields not found by OCR produce `state: NOT_FOUND` — this is correct,
  not a bug. Add a close-up image for small-text fields.
- `NOT_VERIFIABLE` means the field was found by the primary pass but could
  not be cross-checked (secondary pass unavailable or returned nothing).
  This causes the field to route to REVIEW rather than PASS or FAIL.
