"""
PaddleOCR engine adapter -- intended primary per ARCHITECTURE.md.

# TODO(stub): paddlepaddle has no Python 3.14 wheel as of 2026-09.
# This module raises RuntimeError at construction time.
# Replace with a working implementation when the wheel ships:
#
#   pip install paddlepaddle paddleocr
#   Then implement PaddleOCREngine.recognize() and .recognize_region()
#   following the same OCREngine protocol as EasyOCREngine.
#
# Reference: https://paddlepaddle.github.io/PaddleOCR/
# Watch: https://pypi.org/project/paddlepaddle/ for 3.14 wheel availability
#
# When available, swap engine selection in pipeline.py from EasyOCREngine
# to PaddleOCREngine as primary, keeping EasyOCREngine as secondary.
"""

from app.ocr.engines.base import OCREngine, OCRResult  # noqa: F401


class PaddleOCREngine:
    """Placeholder that raises RuntimeError on construction.

    Tests that need a cross-check engine must use a mock or EasyOCREngine instead.
    """

    name: str = "paddleocr"

    def __init__(self) -> None:
        raise RuntimeError(
            "PaddleOCR is not available in this environment "
            "(paddlepaddle has no Python 3.14 wheel on Windows). "
            "# TODO(stub): install paddlepaddle when Python 3.14 support ships."
        )

    def recognize(self, image_path: str) -> list[OCRResult]:  # pragma: no cover
        raise RuntimeError("PaddleOCR unavailable")

    def recognize_region(  # pragma: no cover
        self,
        image_path: str,
        bbox: tuple[int, int, int, int],
        zoom: float = 2.0,
    ) -> list[OCRResult]:
        raise RuntimeError("PaddleOCR unavailable")
