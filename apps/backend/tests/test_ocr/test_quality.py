"""
Tests for image quality scoring (app/ocr/quality.py).

All tests create in-memory images with Pillow — no disk files needed,
no external models. Validates that the scoring thresholds behave as documented.
"""

import io

import numpy as np
import pytest
from PIL import Image, ImageFilter

from app.ocr.quality import QualityResult, score_image

# ---------------------------------------------------------------------------
# Helpers — build synthetic test images in memory
# ---------------------------------------------------------------------------


def _make_jpeg_bytes(width: int, height: int, brightness: int = 128, blur: bool = False) -> bytes:
    """Create a synthetic grayscale JPEG image and return raw bytes."""
    arr = np.full((height, width), brightness, dtype=np.uint8)
    # Add a simple text-like pattern (horizontal lines) so Laplacian > 0
    for row in range(10, height - 10, 20):
        arr[row, :] = 0
    img = Image.fromarray(arr, mode="L").convert("RGB")
    if blur:
        img = img.filter(ImageFilter.GaussianBlur(radius=5))
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    return buf.getvalue()


def _write_tmp(tmp_path, name: str, data: bytes) -> str:
    p = tmp_path / name
    p.write_bytes(data)
    return str(p)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------


def test_score_returns_quality_result(tmp_path):
    path = _write_tmp(tmp_path, "img.jpg", _make_jpeg_bytes(640, 480))
    result = score_image(path)
    assert isinstance(result, QualityResult)
    assert result.quality in ("high", "medium", "low")
    assert isinstance(result.accepted, bool)
    assert result.sharpness >= 0.0
    assert result.width == 640
    assert result.height == 480


def test_sharp_bright_image_is_high_or_medium(tmp_path):
    """A sharp, well-lit image should not be rated low."""
    path = _write_tmp(tmp_path, "good.jpg", _make_jpeg_bytes(800, 600, brightness=128))
    result = score_image(path)
    assert result.quality != "low"
    assert result.accepted is True


def test_very_dark_image_is_low(tmp_path):
    """Mean brightness near 0 → low quality, not accepted."""
    arr = np.zeros((480, 640, 3), dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    path = _write_tmp(tmp_path, "dark.jpg", buf.getvalue())
    result = score_image(path)
    assert result.quality == "low"
    assert result.accepted is False


def test_over_exposed_image_is_low(tmp_path):
    """Mean brightness near 255 → low quality, not accepted."""
    arr = np.full((480, 640, 3), 254, dtype=np.uint8)
    img = Image.fromarray(arr)
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    path = _write_tmp(tmp_path, "bright.jpg", buf.getvalue())
    result = score_image(path)
    assert result.quality == "low"
    assert result.accepted is False


def test_tiny_image_is_low(tmp_path):
    """Image below minimum resolution → low quality."""
    path = _write_tmp(tmp_path, "tiny.jpg", _make_jpeg_bytes(100, 100))
    result = score_image(path)
    assert result.quality == "low"
    assert result.accepted is False


def test_missing_file_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        score_image(str(tmp_path / "nonexistent.jpg"))


def test_high_quality_image_is_accepted(tmp_path):
    """High-sharpness, normal brightness, adequate resolution → accepted."""
    path = _write_tmp(tmp_path, "good.jpg", _make_jpeg_bytes(1280, 960, brightness=128))
    result = score_image(path)
    assert result.accepted is True


def test_blurred_image_rated_low_or_medium(tmp_path):
    """Heavy blur → sharpness drops below threshold → low or medium."""
    path = _write_tmp(tmp_path, "blurred.jpg", _make_jpeg_bytes(640, 480, blur=True))
    result = score_image(path)
    # Blurred images should not be rated high
    assert result.quality in ("low", "medium")
