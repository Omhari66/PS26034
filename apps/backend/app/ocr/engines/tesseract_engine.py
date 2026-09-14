"""
app/ocr/engines/tesseract_engine.py

Tesseract OCR adapter — secondary cross-check engine for PS 26034.

Architecture: ARCHITECTURE.md Known Decisions
  EasyOCR (primary) + Tesseract (secondary) — genuinely independent architectures.
  EasyOCR: neural CRNN-based. Tesseract: rule-based layout + LSTM.
  PaddleOCR cannot construct on Python 3.14 / Windows.

Install:
  winget install UB-Mannheim.TesseractOCR -e
  uv add pytesseract pillow
"""

from __future__ import annotations

from pathlib import Path

from app.ocr.engines.base import OCRResult

_NAME = "tesseract"

_WINDOWS_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]


def _find_tesseract_cmd() -> str | None:
    for p in _WINDOWS_TESSERACT_PATHS:
        if Path(p).exists():
            return p
    return None


class TesseractEngine:
    """
    Lightweight pytesseract wrapper used as the secondary OCR cross-check engine.
    Returns OCRResult objects in the same format as EasyOCREngine.
    Language: English + Hindi ('eng+hin'). Hindi requires the hin.traineddata
    pack — included in the UB-Mannheim installer as an optional component.
    """

    name = _NAME

    def __init__(self, lang: str = "eng+hin") -> None:
        try:
            import pytesseract
            from PIL import Image  # noqa: F401
        except ImportError as e:
            raise ImportError(
                "pytesseract and Pillow required. Run: uv add pytesseract pillow"
            ) from e

        self._pytesseract = pytesseract
        self._lang = lang

        tesseract_path = _find_tesseract_cmd()
        if tesseract_path:
            pytesseract.pytesseract.tesseract_cmd = tesseract_path

        try:
            pytesseract.get_tesseract_version()
        except pytesseract.TesseractNotFoundError as e:
            raise RuntimeError(
                "Tesseract binary not found. "
                "Install: winget install UB-Mannheim.TesseractOCR -e "
                "then restart terminal."
            ) from e

    def recognize(self, image_path: str) -> list[OCRResult]:
        """Full-image OCR. Returns one OCRResult per recognised word."""
        from PIL import Image

        image = Image.open(image_path).convert("RGB")
        data = self._pytesseract.image_to_data(
            image,
            lang=self._lang,
            output_type=self._pytesseract.Output.DICT,
        )
        results: list[OCRResult] = []
        for i in range(len(data["text"])):
            text = data["text"][i].strip()
            conf = data["conf"][i]
            if not text or conf < 0:
                continue
            x, y, w, h = data["left"][i], data["top"][i], data["width"][i], data["height"][i]
            results.append(
                OCRResult(
                    text=text,
                    bbox=(x, y, x + w, y + h),
                    confidence=float(conf) / 100.0,
                    engine_name=_NAME,
                )
            )
        return results

    def recognize_region(
        self,
        image_path: str,
        bbox: tuple[int, int, int, int],
        zoom: float = 2.0,
    ) -> list[OCRResult]:
        """Crop + upscale a region and OCR it. Used for cross-checking a specific candidate bbox."""
        from PIL import Image

        image = Image.open(image_path).convert("RGB")
        x1, y1, x2, y2 = bbox
        cropped = image.crop((x1, y1, x2, y2))
        new_size = (int(cropped.width * zoom), int(cropped.height * zoom))
        upscaled = cropped.resize(new_size, Image.LANCZOS)
        data = self._pytesseract.image_to_data(
            upscaled,
            lang=self._lang,
            output_type=self._pytesseract.Output.DICT,
        )
        results: list[OCRResult] = []
        for i in range(len(data["text"])):
            text = data["text"][i].strip()
            conf = data["conf"][i]
            if not text or conf < 0:
                continue
            bx = x1 + int(data["left"][i] / zoom)
            by = y1 + int(data["top"][i] / zoom)
            bw = int(data["width"][i] / zoom)
            bh = int(data["height"][i] / zoom)
            results.append(
                OCRResult(
                    text=text,
                    bbox=(bx, by, bx + bw, by + bh),
                    confidence=float(conf) / 100.0,
                    engine_name=_NAME,
                )
            )
        return results
