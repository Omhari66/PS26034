
from app.ocr.engines.base import OCRResult
from app.ocr.field_extractor import extract_field


def test_single_block():
    text = (
        "MFD: 01/2025. BBD/Expiry: 12/2026. "
        "Manufactured by: Apex Pharma. Marketed by: Global Retail."
    )
    ocr_results = [
        OCRResult(
            text=text, bbox=[0, 0, 10, 10], confidence=0.99, engine_name="test"
        )
    ]
    print("=== SINGLE BLOCK ===")
    print("manufacturing_date:")
    res = extract_field("manufacturing_date", ocr_results)
    if res:
        print(f"  Raw: {res.raw_value}")
        print(f"  Normalized: {res.normalized_value}")
    else:
        print("  Not found")
        
    print("manufacturer_name:")
    res = extract_field("manufacturer_name", ocr_results)
    if res:
        print(f"  Raw: {res.raw_value}")
        print(f"  Normalized: {res.normalized_value}")
    else:
        print("  Not found")

def test_multi_block():
    ocr_results = [
        OCRResult(
            text="MFD: 01/2025.", bbox=[0, 0, 10, 10], confidence=0.99, engine_name="test"
        ),
        OCRResult(
            text="BBD/Expiry: 12/2026.",
            bbox=[0, 10, 10, 20],
            confidence=0.99,
            engine_name="test",
        ),
        OCRResult(
            text="Manufactured by: Apex Pharma.",
            bbox=[0, 20, 10, 30],
            confidence=0.99,
            engine_name="test",
        ),
        OCRResult(
            text="Marketed by: Global Retail.",
            bbox=[0, 30, 10, 40],
            confidence=0.99,
            engine_name="test",
        ),
    ]
    print("\n=== MULTI BLOCK ===")
    print("manufacturing_date:")
    res = extract_field("manufacturing_date", ocr_results)
    if res:
        print(f"  Raw: {res.raw_value}")
        print(f"  Normalized: {res.normalized_value}")
    else:
        print("  Not found")
        
    print("manufacturer_name:")
    res = extract_field("manufacturer_name", ocr_results)
    if res:
        print(f"  Raw: {res.raw_value}")
        print(f"  Normalized: {res.normalized_value}")
    else:
        print("  Not found")

if __name__ == "__main__":
    test_single_block()
    test_multi_block()
