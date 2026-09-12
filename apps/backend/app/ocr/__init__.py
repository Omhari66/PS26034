"""
app/ocr package — exports for convenient importing.
"""

from app.ocr.engines.base import OCREngine, OCRResult
from app.ocr.engines.easyocr_engine import EasyOCREngine
from app.ocr.pipeline import run_pipeline
from app.ocr.quality import QualityResult, score_image

__all__ = [
    "OCREngine",
    "OCRResult",
    "EasyOCREngine",
    "run_pipeline",
    "QualityResult",
    "score_image",
]
