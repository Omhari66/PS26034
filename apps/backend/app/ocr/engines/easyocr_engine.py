"""
EasyOCR engine adapter — primary OCR engine for PS 26034.

Architecture note (ARCHITECTURE.md):
  PaddleOCR is the intended primary engine. EasyOCR is used here because
  paddlepaddle does not currently ship a wheel for Python 3.14 on Windows.
  # TODO(phase2-upgrade): Swap this file for paddleocr_engine.py once
  # paddlepaddle publishes a Python 3.14 wheel.

Cross-check strategy (CONTRACTS.md #2):
  For critical fields, pipeline.py calls recognize_region() which crops the
  candidate bbox, scales it up 2× (providing more pixels per character),
  and re-runs EasyOCR. This gives a genuinely different image representation
  to the same model — sufficient for detecting read errors caused by
  distortion, blur, or label curvature. A true dual-model setup (e.g.
  EasyOCR + PaddleOCR) is preferred but unavailable in this environment.
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from app.ocr.engines.base import OCRResult

_NAME = "easyocr"


def _polygon_to_bbox(polygon: list[list[int]]) -> tuple[int, int, int, int]:
    """Convert EasyOCR's 4-corner polygon to (x1, y1, x2, y2) bbox."""
    xs = [int(p[0]) for p in polygon]
    ys = [int(p[1]) for p in polygon]
    return (min(xs), min(ys), max(xs), max(ys))


def _load_numpy(image_path: str) -> np.ndarray:
    """Load image as RGB numpy array (EasyOCR's preferred input)."""
    return np.array(Image.open(image_path).convert("RGB"))


def _crop_and_zoom(image_path: str, bbox: tuple[int, int, int, int], zoom: float) -> np.ndarray:
    """
    Crop image to bbox, scale up by zoom, return as numpy array.
    The zoomed region gives EasyOCR more pixels per character,
    which often produces a different (sometimes corrected) reading.
    """
    x1, y1, x2, y2 = bbox
    # Add a small margin (10px each side) to include nearby text context
    margin = 10
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    crop_box = (
        max(0, x1 - margin),
        max(0, y1 - margin),
        min(w, x2 + margin),
        min(h, y2 + margin),
    )
    cropped = img.crop(crop_box)
    new_size = (int(cropped.width * zoom), int(cropped.height * zoom))
    zoomed = cropped.resize(new_size, Image.LANCZOS)
    return np.array(zoomed)


class EasyOCREngine:
    """
    EasyOCR adapter. The reader is lazily initialised on first use to
    avoid downloading model weights during import (which breaks fast tests).
    Tests should inject a mock in place of this class via DI.
    """

    name: str = _NAME

    def __init__(self, lang_list: list[str] | None = None) -> None:
        # Gap 5 (language routing): Hindi enabled so bilingual labels are
        # processed rather than routing to NOT_FOUND for any Hindi declaration.
        # Unsupported scripts still route to NOT_VERIFIABLE — see CONTRACTS.md §2.
        self._lang_list = lang_list or ["en", "hi"]
        self._reader = None  # lazy

    def _get_reader(self):
        if self._reader is None:
            import easyocr  # noqa: PLC0415

            self._reader = easyocr.Reader(
                self._lang_list,
                gpu=False,    # CPU-only for portability; set True in GPU env
                verbose=False,
            )
        return self._reader

    def _results_from_raw(self, raw: list) -> list[OCRResult]:
        """
        Convert EasyOCR output to OCRResult objects.
        EasyOCR output: [(polygon, text, confidence), ...]
        """
        results = []
        for polygon, text, confidence in raw:
            bbox = _polygon_to_bbox(polygon)
            if text.strip():
                results.append(
                    OCRResult(
                        text=text.strip(),
                        bbox=bbox,
                        confidence=float(confidence),
                        engine_name=_NAME,
                    )
                )
        return results

    def recognize(self, image_path: str) -> list[OCRResult]:
        """Full-image OCR pass."""
        arr = _load_numpy(image_path)
        raw = self._get_reader().readtext(arr)
        return self._results_from_raw(raw)

    def recognize_region(
        self,
        image_path: str,
        bbox: tuple[int, int, int, int],
        zoom: float = 2.0,
    ) -> list[OCRResult]:
        """
        Cross-check pass on a single field region (CONTRACTS.md #2).
        Crops to bbox, scales up by zoom, re-runs OCR.
        Returns results with bbox coords relative to the ORIGINAL image
        (bboxes are offset back by crop_left/crop_top before returning).
        """
        x1, y1, _x2, _y2 = bbox
        margin = 10
        arr = _crop_and_zoom(image_path, bbox, zoom)
        raw = self._get_reader().readtext(arr)
        results = self._results_from_raw(raw)

        # Map bbox coords from cropped+zoomed space back to original image space
        crop_left = max(0, x1 - margin)
        crop_top = max(0, y1 - margin)
        remapped = []
        for r in results:
            rx1, ry1, rx2, ry2 = r.bbox
            remapped.append(
                OCRResult(
                    text=r.text,
                    bbox=(
                        int(crop_left + rx1 / zoom),
                        int(crop_top + ry1 / zoom),
                        int(crop_left + rx2 / zoom),
                        int(crop_top + ry2 / zoom),
                    ),
                    confidence=r.confidence,
                    engine_name=r.engine_name,
                )
            )
        return remapped
