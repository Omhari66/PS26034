"""
Conflict detection — CONTRACTS.md #3.

Input:  two ExtractionResult objects for the same field (primary + secondary)
Output: (is_conflicting: bool, candidates: list[str])

MUST NOT: silently resolve disagreements — any genuine disagreement must
surface as CONFLICTING so the evidence viewer can show both readings.

Conflict is defined differently per field type:
  - Numeric fields (mrp, net_quantity):
      If normalized numeric values differ by > NUMERIC_TOLERANCE → conflict.
  - Text fields (manufacturing_date, manufacturer_name, consumer_care):
      If normalized strings differ after whitespace/case/punctuation cleanup
      AND edit-distance ratio > TEXT_CONFLICT_THRESHOLD → conflict.
"""

from __future__ import annotations

import re

from app.ocr.field_extractor import ExtractionResult

# Numeric fields: conflict if |a - b| / max(a, b) > this ratio
_NUMERIC_TOLERANCE = 0.05  # 5%

# Text fields: conflict if character-level similarity < this
_TEXT_SIMILARITY_MIN = 0.75  # 75% similar → not conflicting

# Fields where the value should be numeric (parseable as float)
_NUMERIC_FIELDS = {"mrp"}

# Net quantity needs unit comparison too
_UNIT_NUMERIC_FIELDS = {"net_quantity"}


def _normalize_text(text: str) -> str:
    """Lowercase, remove punctuation, collapse whitespace."""
    t = text.lower().strip()
    t = re.sub(r"[^\w\s]", "", t)
    t = re.sub(r"\s+", " ", t)
    return t


def _extract_numeric(text: str) -> float | None:
    """Extract the first float found in a string."""
    m = re.search(r"(\d+(?:[.,]\d+)?)", text.replace(",", ""))
    if m:
        try:
            return float(m.group(1))
        except ValueError:
            return None
    return None


def _similarity_ratio(a: str, b: str) -> float:
    """
    Simple character-level similarity: 2 * matches / total.
    Fast approximation of Ratcliff/Obershelp without external libraries.
    """
    if a == b:
        return 1.0
    if not a or not b:
        return 0.0
    # Count matching characters (unordered — cheap approximation)
    from collections import Counter
    ca, cb = Counter(a), Counter(b)
    matches = sum((ca & cb).values())
    return 2 * matches / (len(a) + len(b))


def detect_conflict(
    primary: ExtractionResult,
    secondary: ExtractionResult,
) -> tuple[bool, list[str]]:
    """
    Compare primary and secondary extraction results for the same field.
    Returns (is_conflicting, [primary_value, secondary_value]).

    Conflict means the two readings are genuinely different and cannot be
    resolved without human review. The caller must set state = CONFLICTING.
    """
    assert primary.field_name == secondary.field_name, (
        f"Cannot compare different fields: {primary.field_name!r} vs {secondary.field_name!r}"
    )
    candidates = [primary.normalized_value, secondary.normalized_value]

    p_norm = _normalize_text(primary.normalized_value)
    s_norm = _normalize_text(secondary.normalized_value)

    if p_norm == s_norm:
        return False, candidates

    field = primary.field_name

    if field in _NUMERIC_FIELDS:
        p_num = _extract_numeric(p_norm)
        s_num = _extract_numeric(s_norm)
        if p_num is not None and s_num is not None and max(p_num, s_num) > 0:
            diff_ratio = abs(p_num - s_num) / max(p_num, s_num)
            if diff_ratio <= _NUMERIC_TOLERANCE:
                return False, candidates  # within tolerance → no conflict
        return True, candidates

    if field in _UNIT_NUMERIC_FIELDS:
        p_num = _extract_numeric(p_norm)
        s_num = _extract_numeric(s_norm)
        if p_num is not None and s_num is not None and max(p_num, s_num) > 0:
            diff_ratio = abs(p_num - s_num) / max(p_num, s_num)
            if diff_ratio > _NUMERIC_TOLERANCE:
                return True, candidates  # numeric part conflicts

        # Also check that units agree (after normalization)
        p_unit = re.sub(r"[\d.,\s]", "", p_norm)
        s_unit = re.sub(r"[\d.,\s]", "", s_norm)
        if p_unit and s_unit and p_unit != s_unit:
            return True, candidates
        return False, candidates  # numbers agree, units agree or missing

    # Text field — use similarity ratio
    sim = _similarity_ratio(p_norm, s_norm)
    if sim < _TEXT_SIMILARITY_MIN:
        return True, candidates
    return False, candidates
