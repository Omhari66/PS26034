"""
Tests for bbox coordinate mapping (app/ocr/coordinate_map.py).

Pure math — no image I/O, no OCR. Validates that map_to_original correctly
inverts the transform applied before feeding images to the OCR engine.
"""

from app.ocr.coordinate_map import (
    ImageTransform,
    crop_transform,
    identity_transform,
    map_to_original,
    resize_transform,
)


def test_identity_transform_is_noop():
    """Identity transform must return bbox unchanged."""
    t = identity_transform()
    bbox = (10, 20, 100, 200)
    assert map_to_original(bbox, t) == bbox


def test_resize_halved_doubles_coords():
    """Image scaled to 50% → OCR bbox coords halved → original coords restored."""
    # Original: 1000×800. Resized to 500×400 (scale 0.5).
    t = resize_transform(original_w=1000, original_h=800, target_w=500, target_h=400)
    assert t.scale_x == 0.5
    assert t.scale_y == 0.5
    # OCR found bbox at (50, 40, 150, 120) in 500×400 space.
    ocr_bbox = (50, 40, 150, 120)
    orig = map_to_original(ocr_bbox, t)
    # Expected: 50/0.5=100, 40/0.5=80, 150/0.5=300, 120/0.5=240
    assert orig == (100, 80, 300, 240)


def test_resize_doubled_halves_coords():
    """Image scaled to 200% → OCR bbox coords doubled → original coords halved."""
    t = resize_transform(original_w=500, original_h=400, target_w=1000, target_h=800)
    ocr_bbox = (200, 160, 400, 320)  # in 1000×800 space
    orig = map_to_original(ocr_bbox, t)
    assert orig == (100, 80, 200, 160)


def test_crop_offset_is_added_back():
    """Crop removes top-left offset — map_to_original must add it back."""
    t = crop_transform(crop_left=100, crop_top=50)
    ocr_bbox = (10, 5, 90, 45)
    orig = map_to_original(ocr_bbox, t)
    assert orig == (110, 55, 190, 95)


def test_combined_resize_and_crop():
    """Resize then crop: inverse must undo both."""
    # Image cropped at (100, 50) then resized to 50%
    t = ImageTransform(scale_x=0.5, scale_y=0.5, crop_left=100, crop_top=50)
    ocr_bbox = (20, 10, 60, 40)   # in cropped+resized space
    orig = map_to_original(ocr_bbox, t)
    # x: 20/0.5 + 100 = 140, y: 10/0.5 + 50 = 70, etc.
    assert orig == (140, 70, 220, 130)


def test_identity_scale_with_crop():
    """Scale=1, crop offset — only crop offset should shift coordinates."""
    t = ImageTransform(scale_x=1.0, scale_y=1.0, crop_left=30, crop_top=20)
    ocr_bbox = (0, 0, 50, 40)
    orig = map_to_original(ocr_bbox, t)
    assert orig == (30, 20, 80, 60)


def test_resize_transform_factory_attributes():
    """resize_transform factory must set scale_x and scale_y correctly."""
    t = resize_transform(original_w=800, original_h=600, target_w=400, target_h=300)
    assert t.scale_x == 0.5
    assert t.scale_y == 0.5
    assert t.crop_left == 0
    assert t.crop_top == 0


def test_crop_transform_factory_attributes():
    """crop_transform factory must set only crop offsets."""
    t = crop_transform(crop_left=50, crop_top=75)
    assert t.crop_left == 50
    assert t.crop_top == 75
    assert t.scale_x == 1.0
    assert t.scale_y == 1.0
