"""
OCR engine interface — shared dataclasses and Protocol.

Every engine must produce OCRResult objects. The pipeline never touches
raw engine output; it always goes through this abstraction layer.

CONTRACTS.md #2: the OCR + evidence layer MUST NOT decide FAIL/PASS
and MUST NOT run only one engine for critical (cross-check) fields.
These invariants are enforced by pipeline.py, not here.
"""

from __future__ import annotations

import dataclasses
from typing import Protocol, runtime_checkable


@dataclasses.dataclass(frozen=True)
class OCRResult:
    """
    One text detection + recognition result from a single OCR engine pass.

    bbox: (x1, y1, x2, y2) in the coordinate space of the image that was
          fed to the engine. pipeline.py is responsible for mapping this
          back to original-image coordinates via coordinate_map.py.
    """

    text: str
    bbox: tuple[int, int, int, int]  # (x1, y1, x2, y2) — top-left, bottom-right
    confidence: float  # [0.0, 1.0]
    engine_name: str  # "easyocr" | "paddleocr" | …


@runtime_checkable
class OCREngine(Protocol):
    """
    Protocol every OCR engine adapter must satisfy.

    Engines are deliberately kept side-effect-free (CONTRACTS.md #2):
    they read an image path or numpy array, return OCRResult objects, done.
    """

    #: Unique slug used in OCRResult.engine_name and log messages.
    name: str

    def recognize(self, image_path: str) -> list[OCRResult]:
        """
        Run OCR on the full image at image_path.
        Returns all detected text blocks with bboxes and confidence.
        """
        ...

    def recognize_region(
        self,
        image_path: str,
        bbox: tuple[int, int, int, int],
        zoom: float = 2.0,
    ) -> list[OCRResult]:
        """
        Crop image to bbox, scale up by zoom factor, then re-run OCR.
        Used for the cross-check pass on critical fields (CONTRACTS.md #2).
        """
        ...
