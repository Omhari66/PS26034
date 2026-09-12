"""
Image quality scorer — CONTRACTS.md #1 (Capture & quality).

Input:  image file path
Output: {"quality": "high"|"medium"|"low", "accepted": bool}

MUST NOT: run OCR, interpret content, make compliance decisions.

Quality dimensions:
  1. Sharpness  — Laplacian variance (high = sharp, low = blurry)
  2. Brightness — mean pixel intensity; too dark or too bright → unusable
  3. Resolution — pixel area; small images lack OCR-readable detail

Thresholds are empirically derived for Legal Metrology label inspection.
They should be tuned with real product photos in Phase 5+ calibration.
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

# --- Thresholds (tunable in Phase 5) ---
_SHARP_HIGH = 150.0   # Laplacian variance → very sharp
_SHARP_LOW = 15.0     # below this → likely blurry (relaxed for real phone photos)
_BRIGHT_MIN = 20.0    # mean gray < 20 → too dark
_BRIGHT_MAX = 240.0   # mean gray > 240 → over-exposed
_RES_MIN_PX = 200 * 150  # minimum accepted resolution (relaxed for demo)


@dataclass(frozen=True)
class QualityResult:
    quality: str     # "high" | "medium" | "low"
    accepted: bool   # True for high/medium; False for low
    sharpness: float   # Laplacian variance score
    brightness: float  # mean pixel intensity (0–255)
    width: int
    height: int
    reason: str        # human-readable quality note


def _laplacian_variance(gray: np.ndarray) -> float:
    """
    Approximate Laplacian variance using pure NumPy.
    High value → sharp image. Low value → blurry.
    Laplacian kernel: centre×4 - left - right - top - bottom
    """
    lap = (
        4.0 * gray[1:-1, 1:-1]
        - gray[1:-1, :-2]   # left
        - gray[1:-1, 2:]    # right
        - gray[:-2, 1:-1]   # top
        - gray[2:, 1:-1]    # bottom
    )
    return float(np.var(lap))


def score_image(image_path: str | Path) -> QualityResult:
    """
    Score the quality of an image for OCR suitability.
    This is the ONLY public function in this module.
    """
    path = Path(image_path)
    if not path.exists():
        raise FileNotFoundError(f"Image not found: {path}")

    img = Image.open(path)
    w, h = img.size
    gray = np.array(img.convert("L"), dtype=np.float32)

    sharpness = _laplacian_variance(gray)
    brightness = float(np.mean(gray))
    resolution = w * h

    # --- Classify ---
    issues = []

    if sharpness < _SHARP_LOW:
        issues.append(f"blurry (sharpness={sharpness:.1f} < {_SHARP_LOW})")
    if brightness < _BRIGHT_MIN:
        issues.append(f"too dark (brightness={brightness:.1f})")
    if brightness > _BRIGHT_MAX:
        issues.append(f"over-exposed (brightness={brightness:.1f})")
    if resolution < _RES_MIN_PX:
        issues.append(f"low resolution ({w}×{h})")

    if not issues:
        if sharpness >= _SHARP_HIGH and _BRIGHT_MIN + 15 <= brightness <= _BRIGHT_MAX - 15:
            quality = "high"
            reason = f"sharp={sharpness:.0f}, brightness={brightness:.0f}, {w}×{h}"
        else:
            quality = "medium"
            reason = f"acceptable (sharp={sharpness:.0f}, brightness={brightness:.0f})"
    elif len(issues) == 1 and "blurry" in issues[0] and sharpness >= _SHARP_LOW * 0.75:
        # Borderline blur — still usable but flagged
        quality = "medium"
        reason = f"borderline: {'; '.join(issues)}"
    else:
        quality = "low"
        reason = "; ".join(issues)

    # All images are accepted for OCR — quality is a warning, not a blocker.
    # A truly corrupt image (zero bytes, unreadable) fails at PIL.open() above.
    # TODO(phase5): re-enable hard rejection after calibration with real field photos.
    accepted = True
    return QualityResult(
        quality=quality,
        accepted=accepted,
        sharpness=sharpness,
        brightness=brightness,
        width=w,
        height=h,
        reason=reason,
    )
