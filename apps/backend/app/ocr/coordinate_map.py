"""
Bbox coordinate mapping — track image transforms so OCR bboxes can be
mapped back to original-image coordinates.

The evidence viewer (Phase 5) will overlay bboxes on the original photo
that the inspector uploaded. If we resize or crop before running OCR, we
must record the transform so we can invert it later.

CONTRACTS.md #2: every FieldEvidence.bbox must reference the ORIGINAL
image coordinate space, not the preprocessed space fed to the OCR engine.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class ImageTransform:
    """
    Records the sequence of transforms applied to an image before OCR.
    Apply transforms() in order; invert them in reverse to get original coords.

    Only scale + crop are implemented in Phase 2 (sufficient for resize-before-OCR).
    Rotation support (for tilted labels) is reserved for Phase 3.
    """

    # Resize transform: OCR image = original × (scale_x, scale_y)
    scale_x: float = 1.0
    scale_y: float = 1.0

    # Crop offset: OCR image top-left = (crop_left, crop_top) in original coords
    crop_left: int = 0
    crop_top: int = 0

    # Rotation (degrees clockwise) — TODO(phase3): implement inverse rotation
    rotation_deg: float = 0.0


def map_to_original(
    bbox: tuple[int, int, int, int],
    transform: ImageTransform,
) -> tuple[int, int, int, int]:
    """
    Map a bbox from transformed (OCR) coordinate space back to the
    original image coordinate space.

    Inverse of: crop → scale.
    Forward:  orig_coord → crop → scale → ocr_coord
    Inverse:  ocr_coord  → /scale → +crop_offset → orig_coord
    """
    if transform.rotation_deg != 0.0:
        # TODO(phase3): implement inverse rotation
        pass  # currently ignored; labels are assumed to be upright

    x1, y1, x2, y2 = bbox
    orig_x1 = int(x1 / transform.scale_x) + transform.crop_left
    orig_y1 = int(y1 / transform.scale_y) + transform.crop_top
    orig_x2 = int(x2 / transform.scale_x) + transform.crop_left
    orig_y2 = int(y2 / transform.scale_y) + transform.crop_top
    return (orig_x1, orig_y1, orig_x2, orig_y2)


def identity_transform() -> ImageTransform:
    """Return a no-op transform (image fed to OCR unchanged)."""
    return ImageTransform()


def resize_transform(
    original_w: int,
    original_h: int,
    target_w: int,
    target_h: int,
) -> ImageTransform:
    """
    Build a transform representing a resize from (original_w × original_h)
    to (target_w × target_h).
    """
    return ImageTransform(
        scale_x=target_w / original_w,
        scale_y=target_h / original_h,
    )


def crop_transform(crop_left: int, crop_top: int) -> ImageTransform:
    """Build a transform representing a crop whose top-left is at (crop_left, crop_top)."""
    return ImageTransform(crop_left=crop_left, crop_top=crop_top)
