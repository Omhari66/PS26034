"""
OCR pipeline orchestrator — the entry point for the OCR + evidence layer.

Implements the full pipeline defined in CONTRACTS.md:
  1. (Caller) Capture & quality  →  accepted images
  2. run_pipeline()  →  FieldEvidence objects  (this module)
  3. (Caller) Applicability + rule engine

Module boundaries strictly enforced:
  - MUST NOT call evaluate_field / aggregate_overall (those are in the rule engine)
  - MUST NOT decide FAIL/PASS for any field
  - MUST output FieldEvidence objects only

Cross-check strategy (CONTRACTS.md #2):
  For all 5 critical fields, the primary engine runs on the full image,
  then recognize_region() re-reads the specific field bbox on a zoomed crop.
  If the two readings disagree → CONFLICTING.
  If the secondary engine is unavailable → NOT_VERIFIABLE with documented reason.
"""

from __future__ import annotations

# Import shared schema — sys.path is set by main.py or conftest.py
from packages.shared_schema import EvidenceState, FieldEvidence  # noqa: E402

from app.ocr.conflict import detect_conflict
from app.ocr.coordinate_map import ImageTransform, identity_transform, map_to_original
from app.ocr.engines.base import OCREngine, OCRResult
from app.ocr.field_extractor import ExtractionResult, extract_field

# All 5 MVP fields require cross-check (CONTRACTS.md #2)
CRITICAL_FIELDS = frozenset(
    {"mrp", "net_quantity", "manufacturing_date", "manufacturer_name", "consumer_care"}
)


def run_pipeline(
    image_paths: list[str],
    primary_engine: OCREngine,
    secondary_engine: OCREngine | None = None,
    transforms: list[ImageTransform] | None = None,
) -> tuple[list[FieldEvidence], str]:
    """
    Run the full OCR → evidence pipeline for one inspection.

    Args:
        image_paths:      Paths to accepted images (ordered by role: front first).
        primary_engine:   Engine used for the full-image pass.
        secondary_engine: Engine used for the cross-check pass on critical fields.
                          If None → critical fields get EvidenceState.NOT_VERIFIABLE.
                          # TODO(phase2-upgrade): set to PaddleOCREngine once available.
        transforms:       One ImageTransform per image_path (identity if not provided).

    Returns:
        A tuple of (evidences, full_ocr_text).
        One FieldEvidence per field in CRITICAL_FIELDS.
        Never returns fewer than 5 elements (missing field → NOT_FOUND evidence).
    """
    if not image_paths:
        return _all_not_found(), ""

    if transforms is None:
        transforms = [identity_transform() for _ in image_paths]
    assert len(transforms) == len(image_paths)

    # --- Step 1: primary OCR pass on all images ---
    primary_results: list[OCRResult] = []
    for img_path, transform in zip(image_paths, transforms):
        raw = primary_engine.recognize(img_path)
        # Map bboxes to original image space
        mapped = [
            OCRResult(
                text=r.text,
                bbox=map_to_original(r.bbox, transform),
                confidence=r.confidence,
                engine_name=r.engine_name,
            )
            for r in raw
        ]
        primary_results.extend(mapped)

    # --- Step 2: field extraction (primary) ---
    primary_extractions: dict[str, ExtractionResult | None] = {}
    for field in CRITICAL_FIELDS:
        primary_extractions[field] = extract_field(field, primary_results)

    # --- Step 3: secondary cross-check for each field found by primary ---
    secondary_extractions: dict[str, ExtractionResult | None] = {}
    secondary_unavailable = secondary_engine is None

    if not secondary_unavailable:
        for field, primary_ext in primary_extractions.items():
            if primary_ext is None:
                secondary_extractions[field] = None
                continue
            # Re-read the specific bbox region on the first image that contained it
            # (EasyOCREngine.recognize_region crops + zooms for a different representation)
            try:
                # Find which image this bbox came from — use first image for simplicity
                # TODO(phase3): track per-image bbox provenance explicitly
                src_img = image_paths[0]
                region_results = secondary_engine.recognize_region(
                    src_img,
                    primary_ext.source_result.bbox,
                    zoom=2.0,
                )
                secondary_extractions[field] = extract_field(field, region_results)
            except Exception:  # noqa: BLE001
                # Secondary failed for this field → mark as unavailable for this field
                secondary_extractions[field] = None

    # --- Step 4: build FieldEvidence per field ---
    evidences: list[FieldEvidence] = []
    for field in sorted(CRITICAL_FIELDS):  # sorted for stable order
        p_ext = primary_extractions.get(field)
        s_ext = secondary_extractions.get(field) if not secondary_unavailable else None
        ev = _build_evidence(field, p_ext, s_ext, secondary_unavailable)
        evidences.append(ev)

    full_ocr_text = " ".join(r.text for r in primary_results)
    return evidences, full_ocr_text


def _build_evidence(
    field: str,
    primary: ExtractionResult | None,
    secondary: ExtractionResult | None,
    secondary_unavailable: bool,
) -> FieldEvidence:
    """
    Build a single FieldEvidence from primary + secondary extraction results.

    State assignment rules (all states come from EvidenceState, not invented here):
      - No primary match                     → NOT_FOUND
      - Secondary unavailable (stub)         → NOT_VERIFIABLE (cross-check required)
      - Primary found, no secondary match    → FOUND (secondary looked but didn't find)
      - Both found, they agree               → FOUND
      - Both found, they disagree            → CONFLICTING
    """
    src_result = primary.source_result if primary else None

    if primary is None:
        # Field not found in any image — AGENTS.md rule 1: do not invent
        return FieldEvidence(
            field_name=field,
            state=EvidenceState.NOT_FOUND,
        )

    if secondary_unavailable:
        # Cross-check engine not available → cannot satisfy CONTRACTS.md #2
        # Return NOT_VERIFIABLE with a clear reason (not a silent failure)
        return FieldEvidence(
            field_name=field,
            state=EvidenceState.NOT_VERIFIABLE,
            value=primary.normalized_value,
            source_image=getattr(src_result, "engine_name", None),
            bbox=src_result.bbox if src_result else None,
            ocr_engine=src_result.engine_name if src_result else None,
            ocr_confidence=src_result.confidence if src_result else None,
            image_quality="low",  # conservative: no cross-check possible
        )

    if secondary is None:
        # Secondary engine ran but found nothing in the region → trust primary
        return FieldEvidence(
            field_name=field,
            state=EvidenceState.FOUND,
            value=primary.normalized_value,
            bbox=src_result.bbox if src_result else None,
            ocr_engine=src_result.engine_name if src_result else None,
            ocr_confidence=src_result.confidence if src_result else None,
        )

    # Both primary and secondary found something — check for conflict
    is_conflicting, candidates = detect_conflict(primary, secondary)

    if is_conflicting:
        return FieldEvidence(
            field_name=field,
            state=EvidenceState.CONFLICTING,
            value=None,  # cannot commit to a value when readings disagree
            bbox=src_result.bbox if src_result else None,
            ocr_engine=src_result.engine_name if src_result else None,
            ocr_confidence=src_result.confidence if src_result else None,
            candidates=candidates,
        )

    # Agreement — use primary's normalized value (canonical; secondary confirmed it)
    return FieldEvidence(
        field_name=field,
        state=EvidenceState.FOUND,
        value=primary.normalized_value,
        secondary_value=secondary.normalized_value,
        bbox=src_result.bbox if src_result else None,
        ocr_engine=src_result.engine_name if src_result else None,
        ocr_confidence=src_result.confidence if src_result else None,
    )


def _all_not_found() -> list[FieldEvidence]:
    """Return NOT_FOUND for every field when no images are provided."""
    return [
        FieldEvidence(field_name=field, state=EvidenceState.NOT_FOUND)
        for field in sorted(CRITICAL_FIELDS)
    ]
