from app.services.category_checker import check_category_mismatch


def test_category_checker_no_mismatch_same_keywords():
    ocr_text = "ingredients include wheat, milk and sugar"
    is_mismatch, warning = check_category_mismatch(ocr_text, "packaged_food")
    assert is_mismatch is False
    assert warning is None


def test_category_checker_no_mismatch_empty():
    ocr_text = "some random text with no keywords"
    is_mismatch, warning = check_category_mismatch(ocr_text, "cosmetics")
    assert is_mismatch is False
    assert warning is None


def test_category_checker_mismatch_detected():
    ocr_text = "moisturizer lotion with aloe vera"
    is_mismatch, warning = check_category_mismatch(ocr_text, "packaged_food")
    assert is_mismatch is True
    assert "lotion" in warning
    assert "Cosmetics" in warning


def test_category_checker_ignores_unknown_category():
    ocr_text = "cotton shirt"
    is_mismatch, warning = check_category_mismatch(ocr_text, "unknown_category")
    assert is_mismatch is False
    assert warning is None


def test_category_checker_prioritizes_selected_keywords():
    # Even if it mentions 'cream' (cosmetics keyword), if it's 'ice cream' (milk/food),
    # it shouldn't mismatch if selected is food
    ocr_text = "ice cream made of milk"
    is_mismatch, warning = check_category_mismatch(ocr_text, "packaged_food")
    assert is_mismatch is False
    assert warning is None
