/**
 * Local/Static Category Sanity Check (Phase 3.5 Ticket 6).
 *
 * Compares raw OCR text against a static keyword dictionary to detect
 * likely category mismatches (e.g., OCR text contains 'chocolate' when
 * category is set to 'cosmetics').
 *
 * MUST NOT:
 * - Make network calls
 * - Call an LLM or ML model
 * - Auto-correct or change the category
 * - Block submission (produces a soft yellow warning only)
 */

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  packaged_food: [
    'food', 'snack', 'biscuit', 'cookie', 'namkeen', 'chocolate', 'chips',
    'juice', 'beverage', 'sweet', 'milk', 'butter', 'cheese', 'paneer',
    'atta', 'dal', 'rice', 'wheat', 'spices', 'masala', 'edible', 'candy', 'wafer',
  ],
  cosmetics: [
    'cream', 'lotion', 'soap', 'shampoo', 'perfume', 'deodorant', 'powder',
    'makeup', 'lipstick', 'nail', 'hair', 'face', 'wash', 'moisturizer', 'serum',
    'skincare', 'dermatologically',
  ],
  drugs_pharma: [
    'tablet', 'syrup', 'capsule', 'ointment', 'gel', 'injection',
    'pharmaceutical', 'medicine', 'rx', 'schedule', 'dosage', 'mg',
  ],
  textiles: [
    'cotton', 'polyester', 'silk', 'shirt', 'pant', 'garment', 'wear',
    'fabric', 'textile', 'apparel', 'clothing', 'size', 'wool', 'nylon',
  ],
  packaged_commodity: [
    'detergent', 'cleaner', 'cement', 'paint', 'steel', 'hardware', 'battery',
    'wire', 'cable', 'pipe', 'lubricant', 'engine oil',
  ],
};

export interface CategoryCheckResult {
  isMismatch: boolean;
  warningMessage: string | null;
  detectedCategory?: string;
  matchedKeyword?: string;
}

export function checkCategoryMismatch(
  ocrText: string,
  selectedCategory: string
): CategoryCheckResult {
  if (!selectedCategory || !CATEGORY_KEYWORDS[selectedCategory]) {
    return { isMismatch: false, warningMessage: null };
  }

  const textLower = ocrText.toLowerCase();

  // 1. Check if any keyword for selected category is present
  const hasSelectedKeywords = CATEGORY_KEYWORDS[selectedCategory].some((kw) =>
    textLower.includes(kw)
  );

  if (hasSelectedKeywords) {
    return { isMismatch: false, warningMessage: null };
  }

  // 2. Check if text strongly matches a different category
  for (const [otherCategory, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (otherCategory === selectedCategory) continue;

    const matched = keywords.find((kw) => textLower.includes(kw));
    if (matched) {
      const selectedLabel = selectedCategory.replace('_', ' ').toUpperCase();
      const otherLabel = otherCategory.replace('_', ' ').toUpperCase();
      return {
        isMismatch: true,
        detectedCategory: otherCategory,
        matchedKeyword: matched,
        warningMessage: `Category warning: OCR text contains '${matched}' suggesting ${otherLabel}, but category is ${selectedLabel}. (The selected category remains active)`,
      };
    }
  }

  return { isMismatch: false, warningMessage: null };
}
