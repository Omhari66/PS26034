"""
Image storage service — CONTRACTS.md #1 (Capture & quality).

Responsibilities:
  - Save uploaded file bytes to local disk
  - Score image quality (via app.ocr.quality)
  - Apply the accepted gate (quality != "low")
  - Persist InspectionImage to DB
  - Provide OCR-ready file paths for the submit pipeline

MUST NOT: run OCR, interpret content, make compliance decisions.
"""

from __future__ import annotations

import uuid
from pathlib import Path

from PIL import Image
from sqlalchemy.orm import Session

from app.models import InspectionImage
from app.ocr.quality import score_image

# Local image storage root — relative to the apps/backend directory.
# TODO(phase5): replace with object-storage client (S3/GCS).
_IMAGES_DIR = Path(__file__).parent.parent / "data" / "images"
_IMAGES_DIR.mkdir(parents=True, exist_ok=True)

VALID_ROLES = frozenset({"front", "back", "close_up"})
VALID_EXTENSIONS = frozenset({".jpg", ".jpeg", ".png", ".webp", ".tiff"})


def store_image(
    db: Session,
    inspection_id: str,
    role: str,
    file_bytes: bytes,
    original_filename: str,
) -> InspectionImage:
    """
    Save an uploaded image, score its quality, and persist the record.

    Args:
        inspection_id:      UUID of the parent Inspection.
        role:               "front" | "back" | "close_up"
        file_bytes:         Raw bytes from the uploaded file.
        original_filename:  Original client filename (used only for extension).

    Returns:
        The persisted InspectionImage row.
    """
    if role not in VALID_ROLES:
        raise ValueError(f"Invalid role {role!r}. Must be one of {sorted(VALID_ROLES)}")

    suffix = Path(original_filename).suffix.lower()
    if suffix not in VALID_EXTENSIONS:
        suffix = ".jpg"  # default to JPEG if unknown extension

    # Save to: data/images/<inspection_id>/<image_id><suffix>
    image_id = str(uuid.uuid4())
    inspection_dir = _IMAGES_DIR / inspection_id
    inspection_dir.mkdir(parents=True, exist_ok=True)
    file_path = inspection_dir / f"{image_id}{suffix}"

    file_path.write_bytes(file_bytes)

    # Score quality
    quality_result = score_image(str(file_path))

    # Read original dimensions
    try:
        with Image.open(file_path) as img:
            w, h = img.size
    except Exception:  # noqa: BLE001
        w, h = None, None

    row = InspectionImage(
        id=image_id,
        inspection_id=inspection_id,
        role=role,
        quality=quality_result.quality,
        accepted=quality_result.accepted,
        file_path=str(file_path.resolve()),
        original_width=w,
        original_height=h,
        sharpness=f"{quality_result.sharpness:.2f}",
        brightness=f"{quality_result.brightness:.2f}",
        quality_reason=quality_result.reason,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_accepted_image_paths(db: Session, inspection_id: str) -> list[str]:
    """Return file paths of all accepted images for this inspection, ordered by upload time."""
    rows = (
        db.query(InspectionImage)
        .filter(
            InspectionImage.inspection_id == inspection_id,
            InspectionImage.accepted == True,  # noqa: E712
        )
        .order_by(InspectionImage.created_at)
        .all()
    )
    return [r.file_path for r in rows]
