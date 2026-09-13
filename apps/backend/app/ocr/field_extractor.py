"""
Field extraction and normalization — CONTRACTS.md #3.

Input:  list of OCRResult (text + bbox + confidence from one engine pass)
Output: ExtractionResult per field — raw matched text + its source bbox

MUST NOT: set state to FOUND/NOT_FOUND/CONFLICTING — that is pipeline.py's job.
MUST NOT: invent values not present in OCR output (AGENTS.md rule 1).

Each field extractor returns the best regex match found in the OCR results,
or None if the field was not found. The pipeline uses these to build FieldEvidence.

Design note: regex patterns are conservative — they require explicit label keywords
(e.g. "MRP", "Net Wt", "Mfg Date") or well-known formatting (Rs./₹ + number).
An ambiguous match is not returned as a high-confidence result.
"""

from __future__ import annotations

import re
from dataclasses import dataclass

from app.ocr.engines.base import OCRResult

# ---------------------------------------------------------------------------
# Regex pattern sets — one list per field, ordered most-specific → general
# ---------------------------------------------------------------------------

_MRP_PATTERNS = [
    # Pattern 1 — specific: requires MRP keyword (high confidence)
    r"(?:MRP|M\.?R\.?P\.?)\s*[:()\s]*(?:Rs\.?|\u20b9|INR\s*)?\s*(\d[\d,]*(?:\.\d{1,2})?)",
    # Pattern 2 — generic: Rs./₹ followed by number (needs context check before use)
    r"(?:Rs\.?|\u20b9)\s*(\d[\d,]*(?:\.\d{1,2})?)",
]

# Context keywords that DISQUALIFY a price candidate from being MRP.
# If any of these appear in the ±3 block context window, Pattern 2 is rejected.
_MRP_NEGATIVE_CONTEXT = {
    "offer", "sale", "discount", "save", "savings", "off",
    "special", "promo", "promotional", "deal", "cashback",
    "price after discount", "net price", "selling price",
}

# Score added to a candidate when MRP-positive keywords appear nearby.
_MRP_POSITIVE_CONTEXT = {
    "mrp": 6,
    "m.r.p": 6,
    "maximum retail price": 5,
    "inclusive of all taxes": 3,
    "incl": 1,
    "taxes": 1,
}

_NET_QTY_PATTERNS = [
    # "Net Wt. / Net Weight / Net Qty / Net Vol: 500g"
    r"(?i)(?:net\s*(?:wt|weight|qty|quantity|vol(?:ume)?|content)\.?|contents?)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(g|gm|gms|kg|ml|l|litre|liter|oz|fl\.?\s*oz)",
    # Bare quantity with unit: "500g" / "1.5 l"
    r"\b(\d+(?:[.,]\d+)?)\s*(g|gm|gms|kg|ml|l|litre|liter)\b",
]

_MFG_DATE_PATTERNS = [
    # "Mfg. Date: 01/2025" / "Date of Mfg: 12-01-2025"
    r"(?i)(?:mfg\.?\s*date?|manufactured\s*(?:on|date|:)|date\s*of\s*mfg|dom|date\s*of\s*manufacture)\s*[:=]?\s*(.{4,20})",
    # ISO or DD/MM/YYYY
    r"\b(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})\b",
    # MM/YYYY or MM-YYYY (common on FMCG)
    r"\b(\d{1,2}[/-]\d{4})\b",
    # "Jan 2025" / "January 2025"
    r"\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+\d{4})\b",
]

# Context keywords for Date disambiguation
_MFG_NEGATIVE_CONTEXT = {
    "best before", "expiry", "exp", "use by", "bbd", "use before"
}

_MFG_POSITIVE_CONTEXT = {
    "mfg", "pkd", "manufactured", "packed", "packaging", "mfd", "dom", "date of mfg"
}

_MFR_NAME_PATTERNS = [
    # Captures (Role, Entity Name)
    r"(?i)(manufactured\s+by|mfr\.?\s*:|mfd\.?\s*by|marketed\s+by|packed\s+by|distributed\s+by)\s*[:\s]\s*(.{5,100})",
]

_CONSUMER_CARE_PATTERNS = [
    # "Consumer Care: 1800-123-456"
    r"(?i)(?:consumer\s*(?:care|helpline|grievance)|customer\s*(?:care|service|helpline)|toll\s*free|call\s*us)\s*[:@]?\s*(.{5,60})",
    # Indian mobile/landline
    r"\b(\+?91[-\s]?\d{10})\b",
    r"\b(1800[-\s]\d{3,4}[-\s]\d{4})\b",  # toll-free
    # E-mail
    r"\b([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})\b",
]

_FIELD_PATTERNS: dict[str, list[str]] = {
    "mrp": _MRP_PATTERNS,
    "net_quantity": _NET_QTY_PATTERNS,
    "manufacturing_date": _MFG_DATE_PATTERNS,
    "manufacturer_name": _MFR_NAME_PATTERNS,
    "consumer_care": _CONSUMER_CARE_PATTERNS,
}


# ---------------------------------------------------------------------------
# Result type
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ExtractionResult:
    """
    A single field match found in OCR output.
    raw_value is the unmodified string extracted from the label.
    normalized_value is cleaned for display and comparison.
    source_result is the OCRResult whose text contained the match.
    """

    field_name: str
    raw_value: str
    normalized_value: str
    source_result: OCRResult  # carries bbox + confidence


# ---------------------------------------------------------------------------
# Normalizers — clean raw OCR text for comparison and storage
# ---------------------------------------------------------------------------

def _normalize_mrp(raw: str) -> str:
    """Strip currency symbols, commas; keep decimal dot. '1,49.00' → '149.00'."""
    cleaned = re.sub(r"[₹$\s]", "", raw)
    cleaned = cleaned.replace(",", "")  # remove thousand separators
    try:
        return f"{float(cleaned):.2f}"
    except ValueError:
        return cleaned.strip()


def _normalize_net_qty(raw: str, unit_raw: str | None = None) -> str:
    """'  500 gm  ' → '500g', '1.5 litre' → '1.5l'."""
    _UNIT_MAP = {
        "gm": "g", "gms": "g", "gram": "g", "grams": "g",
        "litre": "l", "liter": "l",
        "fl oz": "fl oz", "fl. oz": "fl oz",
    }
    val = raw.strip().replace(",", ".")
    unit = (unit_raw or "").lower().strip()
    unit = _UNIT_MAP.get(unit, unit)
    return f"{val}{unit}"


def _normalize_date(raw: str) -> str:
    return raw.strip()


def _normalize_mfr(raw: str) -> str:
    """Strip trailing punctuation, normalize whitespace."""
    return re.sub(r"\s+", " ", raw.strip().rstrip(".,;:"))


def _normalize_cc(raw: str) -> str:
    """Collapse whitespace, strip trailing punctuation."""
    return re.sub(r"\s+", " ", raw.strip().rstrip(".,;:"))


_NORMALIZERS = {
    "mrp": lambda raw, u=None: _normalize_mrp(raw),
    "net_quantity": _normalize_net_qty,
    "manufacturing_date": lambda raw, u=None: _normalize_date(raw),
    "manufacturer_name": lambda raw, u=None: _normalize_mfr(raw),
    "consumer_care": lambda raw, u=None: _normalize_cc(raw),
}


# ---------------------------------------------------------------------------
# Core extraction function
# ---------------------------------------------------------------------------

def extract_field(
    field_name: str,
    ocr_results: list[OCRResult],
) -> ExtractionResult | None:
    """
    Search all OCR text blocks for the best match for field_name.
    Returns None if no pattern matches — the pipeline interprets this as
    EvidenceState.NOT_FOUND (never invents a value).

    For MRP: uses context-window scoring to reject offer/sale prices.
    Strategy: try patterns in priority order across all text blocks.
    """
    if field_name not in _FIELD_PATTERNS:
        raise ValueError(f"Unknown field: {field_name!r}")

    if field_name == "mrp":
        return _extract_mrp_with_context(ocr_results)
    elif field_name == "manufacturer_name":
        return _extract_mfr_with_roles(ocr_results)
    elif field_name == "consumer_care":
        return _extract_cc_with_context(ocr_results)
    elif field_name == "manufacturing_date":
        return _extract_date_with_context(ocr_results)    

    patterns = _FIELD_PATTERNS[field_name]

    candidates: list[tuple[str, str | None, OCRResult]] = []
    for ocr_result in ocr_results:
        text = ocr_result.text
        for pattern in patterns:
            m = re.search(pattern, text, re.IGNORECASE)
            if m:
                groups = m.groups()
                raw = groups[0] if groups else m.group(0)
                unit = groups[1] if len(groups) > 1 else None
                candidates.append((raw, unit, ocr_result))
                break

    if not candidates:
        return None

    best_raw, best_unit, best_src = max(candidates, key=lambda c: c[2].confidence)
    normalizer = _NORMALIZERS[field_name]
    norm = normalizer(best_raw, best_unit)

    return ExtractionResult(
        field_name=field_name,
        raw_value=best_raw,
        normalized_value=norm,
        source_result=best_src,
    )


def _extract_mrp_with_context(
    ocr_results: list[OCRResult],
    context_window: int = 3,
) -> ExtractionResult | None:
    """
    MRP-specific extraction with context-window scoring.

    Strategy:
      1. Collect all price candidates from all OCR blocks.
      2. For each candidate, build a context window (±context_window blocks).
      3. Score the candidate: MRP keywords → positive, Offer/Sale/Discount → disqualify.
      4. Return the highest-scoring candidate with score > 0.
      5. If all candidates score 0 or less → NOT_FOUND (returns None).

    This prevents offer prices, discounts, and promotional figures from being
    selected as MRP.
    """
    import re as _re  # already imported at module level but explicit for clarity

    @dataclass
    class _Candidate:
        raw: str
        norm: str
        source: OCRResult
        score: int
        pattern_idx: int  # 0 = MRP keyword (high confidence), 1 = bare Rs/₹

    candidates: list[_Candidate] = []

    for idx, ocr_result in enumerate(ocr_results):
        text = ocr_result.text
        for pat_idx, pattern in enumerate(_MRP_PATTERNS):
            m = _re.search(pattern, text, _re.IGNORECASE)
            if not m:
                continue
            groups = m.groups()
            raw = groups[0] if groups else m.group(0)

            # Build context: text of the ±context_window surrounding blocks
            lo = max(0, idx - context_window)
            hi = min(len(ocr_results), idx + context_window + 1)
            context_texts = [ocr_results[i].text.lower() for i in range(lo, hi)]
            context_blob = " ".join(context_texts)

            # Pattern 0 (MRP keyword) always starts at +6; skip negative check
            if pat_idx == 0:
                score = 6
            else:
                # Pattern 1 (bare Rs/₹): disqualify if negative context found
                if any(neg in context_blob for neg in _MRP_NEGATIVE_CONTEXT):
                    break  # skip this candidate entirely
                score = 0

            # Add positive context score
            for keyword, pts in _MRP_POSITIVE_CONTEXT.items():
                if keyword in context_blob:
                    score += pts

            norm = _normalize_mrp(raw)
            candidates.append(_Candidate(
                raw=raw, norm=norm, source=ocr_result, score=score, pattern_idx=pat_idx
            ))
            break  # most-specific pattern matched; move to next block

    if not candidates:
        return None

    # Pick highest score; break ties by OCR confidence
    best = max(candidates, key=lambda c: (c.score, c.source.confidence))

    # If the best candidate scored 0 and came from the generic pattern,
    # it has no MRP context — return None rather than guess.
    if best.score == 0 and best.pattern_idx == 1:
        return None

    return ExtractionResult(
        field_name="mrp",
        raw_value=best.raw,
        normalized_value=best.norm,
        source_result=best.source,
    )

def _extract_mfr_with_roles(ocr_results: list[OCRResult], lookahead: int = 2) -> ExtractionResult | None:
    """
    Extracts Manufacturer/Marketer roles.
    Uses a forward-looking context window to handle cases where 
    "Manufactured by:" and the company name are split across sequential OCR blocks.
    """
    import json
    import re as _re

    pairs = []
    best_src = None
    best_conf = -1.0
    seen_pairs = set()
    
    # All role keywords we want to prevent from bleeding into the entity capture
    role_keywords = ["manufactured by", "mfr:", "mfd by", "marketed by", "packed by", "distributed by"]

    for idx, ocr_result in enumerate(ocr_results):
        # Combine current block with the next few blocks to bridge split text
        hi = min(len(ocr_results), idx + lookahead + 1)
        window_blob = " ".join(ocr_results[i].text for i in range(idx, hi))
        
        for pattern in _MFR_NAME_PATTERNS:
            for m in _re.finditer(pattern, window_blob, _re.IGNORECASE):
                role = m.group(1).strip().lower()
                entity = _normalize_mfr(m.group(2).strip())
                
                # Truncate if another role keyword got swallowed by the greedy regex
                for other_role in role_keywords:
                    if other_role in entity.lower():
                        split_idx = entity.lower().find(other_role)
                        entity = _normalize_mfr(entity[:split_idx].strip())
                
                pair_key = (role, entity)
                if pair_key not in seen_pairs and entity:
                    seen_pairs.add(pair_key)
                    pairs.append({"role": role, "entity": entity})
                    
                    # Attribute the source to the block where the role keyword was found
                    if ocr_result.confidence > best_conf:
                        best_conf = ocr_result.confidence
                        best_src = ocr_result

    if not pairs:
        return None

    # Format as requested by CONTRACTS.md
    norm = json.dumps(pairs)
    raw = " | ".join(f"{p['role']}: {p['entity']}" for p in pairs)

    return ExtractionResult(
        field_name="manufacturer_name",
        raw_value=raw,
        normalized_value=norm,
        source_result=best_src,  # type: ignore
    )


def _extract_cc_with_context(ocr_results: list[OCRResult], context_window: int = 3) -> ExtractionResult | None:
    import re as _re

    # Context keywords that qualify a bare phone/email as consumer care
    _CC_CONTEXT = {"consumer", "customer", "care", "helpline", "toll", "grievance", "feedback", "support", "contact"}

    @dataclass
    class _Candidate:
        raw: str
        norm: str
        source: OCRResult
        has_context: bool
        score: int

    candidates: list[_Candidate] = []

    for idx, ocr_result in enumerate(ocr_results):
        text = ocr_result.text
        for pat_idx, pattern in enumerate(_CONSUMER_CARE_PATTERNS):
            m = _re.search(pattern, text, _re.IGNORECASE)
            if not m:
                continue

            groups = m.groups()
            raw = groups[0] if groups else m.group(0)

            has_context = False
            if pat_idx == 0:
                # Explicit Pattern (Consumer Care: ...)
                has_context = True
                score = 10
            else:
                # Bare phone or email — check context
                lo = max(0, idx - context_window)
                hi = min(len(ocr_results), idx + context_window + 1)
                context_blob = " ".join(ocr_results[i].text.lower() for i in range(lo, hi))
                
                if any(kw in context_blob for kw in _CC_CONTEXT):
                    has_context = True
                    score = 5
                else:
                    has_context = False
                    score = 1  # Lowest priority if no context

            norm = _normalize_cc(raw)
            if not has_context:
                norm = f"UNVERIFIED_BARE_CONTACT:{norm}"
                
            candidates.append(_Candidate(
                raw=raw, norm=norm, source=ocr_result, has_context=has_context, score=score
            ))
            break

    if not candidates:
        return None

    best = max(candidates, key=lambda c: (c.score, c.source.confidence))

    return ExtractionResult(
        field_name="consumer_care",
        raw_value=best.raw,
        normalized_value=best.norm,
        source_result=best.source,
    )

def _extract_date_with_context(
    ocr_results: list[OCRResult],
    context_window: int = 3,
) -> ExtractionResult | None:
    """
    Date extraction that distinguishes Manufacturing Date from Expiry Date.
    Requires positive context for generic date patterns and disqualifies 
    them if Expiry/BBD context is found nearby.
    """
    import re as _re
    from dataclasses import dataclass

    @dataclass
    class _Candidate:
        raw: str
        norm: str
        source: OCRResult
        score: int

    candidates: list[_Candidate] = []

    for idx, ocr_result in enumerate(ocr_results):
        text = ocr_result.text
        for pat_idx, pattern in enumerate(_MFG_DATE_PATTERNS):
            m = _re.search(pattern, text, _re.IGNORECASE)
            if not m:
                continue
            
            groups = m.groups()
            raw = groups[0] if groups else m.group(0)

            # Build context window (±3 blocks)
            lo = max(0, idx - context_window)
            hi = min(len(ocr_results), idx + context_window + 1)
            context_blob = " ".join(ocr_results[i].text.lower() for i in range(lo, hi))

            if pat_idx == 0:
                # Pattern 0 already contains explicit MFD/PKD keywords
                score = 10
            else:
                score = 0
                # Add points for Manufacturing context
                for pos in _MFG_POSITIVE_CONTEXT:
                    if pos in context_blob:
                        score += 5
                # Subtract points for Expiry/BBD context
                if any(neg in context_blob for neg in _MFG_NEGATIVE_CONTEXT):
                    score -= 5
            
            norm = _normalize_date(raw)
            candidates.append(_Candidate(
                raw=raw, norm=norm, source=ocr_result, score=score
            ))
            break  # Matched the best date pattern for this block, move on

    if not candidates:
        return None

    best = max(candidates, key=lambda c: (c.score, c.source.confidence))

    # If the candidate has a score of 0 or less, it lacks MFD context or belongs to BBD.
    # We return None so it doesn't get falsely flagged as the Manufacturing Date.
    if best.score <= 0:
        return None

    return ExtractionResult(
        field_name="manufacturing_date",
        raw_value=best.raw,
        normalized_value=best.norm,
        source_result=best.source,
    )    

