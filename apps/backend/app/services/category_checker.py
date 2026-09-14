"""
Category sanity check (Gap 7).
Provides a static keyword mapping for categories and a function to detect mismatches.
"""

from __future__ import annotations

# Static keywords that strongly suggest a specific category
_CATEGORY_KEYWORDS = {
    "packaged_food": {
        "food",
        "snack",
        "biscuit",
        "namkeen",
        "chocolate",
        "chips",
        "juice",
        "beverage",
        "sweet",
        "milk",
        "butter",
        "cheese",
        "paneer",
        "atta",
        "dal",
        "rice",
        "wheat",
        "spices",
        "masala",
        "edible",
    },
    "cosmetics": {
        "cream",
        "lotion",
        "soap",
        "shampoo",
        "perfume",
        "deodorant",
        "powder",
        "makeup",
        "lipstick",
        "nail",
        "hair",
        "face",
        "wash",
        "moisturizer",
        "serum",
    },
    "drugs_pharma": {
        "tablet",
        "syrup",
        "capsule",
        "ointment",
        "gel",
        "injection",
        "pharmaceutical",
        "medicine",
        "rx",
        "schedule",
    },
    "textiles": {
        "cotton",
        "polyester",
        "silk",
        "shirt",
        "pant",
        "garment",
        "wear",
        "fabric",
        "textile",
        "apparel",
        "clothing",
    },
}


def check_category_mismatch(ocr_text: str, selected_category: str) -> tuple[bool, str | None]:
    """
    Checks if the OCR text contains strong keywords belonging to a DIFFERENT category,
    while NOT containing keywords from the selected category.

    Returns: (is_mismatch, warning_message_or_none)
    """
    if selected_category not in _CATEGORY_KEYWORDS:
        return False, None

    text_lower = ocr_text.lower()

    # Check if any keywords for the *selected* category are present
    has_selected_keywords = any(kw in text_lower for kw in _CATEGORY_KEYWORDS[selected_category])

    if has_selected_keywords:
        return False, None

    # If not, check if it strongly matches another category
    for other_category, keywords in _CATEGORY_KEYWORDS.items():
        if other_category == selected_category:
            continue

        matched_keywords = [kw for kw in keywords if kw in text_lower]
        if matched_keywords:
            # We found strong keywords for another category, and none for the selected one
            other_name = other_category.replace("_", " ").title()
            warning = f"Category mismatch detected — '{matched_keywords[0]}' suggests {other_name}. Please verify your category selection."  # noqa: E501
            return True, warning

    return False, None
