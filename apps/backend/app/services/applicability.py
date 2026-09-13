"""
Applicability engine — CONTRACTS.md #4.

Determines:
  - Which rule version is active
  - Which fields are required for a given category
  - Whether a given category is supported at all

This is a pure module: no DB calls, no network, no LLM.
Same inputs → same outputs, always (testable in isolation).

Rule tables are loaded from JSON files at import time and cached.
Adding a new rule version: add rule_table_vX_Y.json in app/rules/,
then register it in RULE_TABLE_REGISTRY below.

AGENTS.md rule 2: Decision and EvidenceState are NOT re-defined here.
They are imported from packages.shared_schema wherever needed.
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# Rule table loading
# ---------------------------------------------------------------------------

_RULES_DIR = Path(__file__).parent.parent / "rules"


def _load_table(filename: str) -> dict[str, Any]:
    path = _RULES_DIR / filename
    with path.open(encoding="utf-8") as f:
        return json.load(f)


# Registry: rule_version → parsed rule table dict
# Order matters — the last entry is treated as the "current" version.
RULE_TABLE_REGISTRY: dict[str, dict[str, Any]] = {
    "v1.0": _load_table("rule_table_v1.json"),
    "v1.1": _load_table("rule_table_v1_1.json"),
}

# The active rule version used for new inspections.
# Changing this string changes which rules apply to newly submitted reports.
# Old reports retain their own rule_version in the DB.
CURRENT_RULE_VERSION: str = "v1.0"


# ---------------------------------------------------------------------------
# Public types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class FieldRule:
    rule_id: str
    field: str
    declaration: str
    legal_ref: str
    description: str
    required: bool


@dataclass(frozen=True)
class CategoryRules:
    rule_version: str
    category: str
    label: str
    supported: bool
    fields: list[FieldRule]
    notes: str


# ---------------------------------------------------------------------------
# Core applicability functions
# ---------------------------------------------------------------------------


def get_rules(
    category: str,
    rule_version: str = CURRENT_RULE_VERSION,
) -> CategoryRules:
    """
    Return the full set of FieldRule objects for a given category + version.

    If category is not supported by this version, returns CategoryRules with
    supported=False and an empty fields list (no rules apply).

    CONTRACTS.md #4: MUST NOT infer category from OCR — caller provides it.
    """
    table = _get_table(rule_version)
    categories: dict = table.get("categories", {})

    if category not in categories:
        return CategoryRules(
            rule_version=rule_version,
            category=category,
            label=category,
            supported=False,
            fields=[],
            notes=f"Category '{category}' is not supported in rule version {rule_version}.",
        )

    cat_def = categories[category]
    required_fields: set[str] = set(cat_def.get("required_fields", []))
    optional_fields: set[str] = set(cat_def.get("optional_fields", []))
    all_fields: set[str] = required_fields | optional_fields

    # Build FieldRule objects from the rule definitions

    field_rules: list[FieldRule] = []
    for rule_def in table.get("rules", []):
        f = rule_def["field"]
        if f not in all_fields and f not in required_fields:
            # Field not relevant for this category at all — not in required or optional
            # still include it as not-required so the rule engine can return NOT_APPLICABLE
            pass
        field_rules.append(
            FieldRule(
                rule_id=rule_def["rule_id"],
                field=f,
                declaration=rule_def["declaration"],
                legal_ref=rule_def["legal_ref"],
                description=rule_def["description"],
                required=(f in required_fields),
            )
        )

    return CategoryRules(
        rule_version=rule_version,
        category=category,
        label=cat_def.get("label", category),
        supported=True,
        fields=field_rules,
        notes=cat_def.get("notes", ""),
    )


def is_field_required(
    field: str,
    category: str,
    rule_version: str = CURRENT_RULE_VERSION,
) -> bool:
    """Return True iff this field is required for the given category + version."""
    table = _get_table(rule_version)
    categories: dict = table.get("categories", {})
    if category not in categories:
        return False
    return field in categories[category].get("required_fields", [])


def is_category_supported(
    category: str,
    rule_version: str = CURRENT_RULE_VERSION,
) -> bool:
    """Return True iff this category exists in the given rule version."""
    table = _get_table(rule_version)
    return category in table.get("categories", {})


def list_supported_categories(rule_version: str = CURRENT_RULE_VERSION) -> list[str]:
    """Return sorted list of supported category keys for a rule version."""
    table = _get_table(rule_version)
    return sorted(table.get("categories", {}).keys())


def list_rule_versions() -> list[str]:
    """Return all registered rule versions, sorted."""
    return sorted(RULE_TABLE_REGISTRY.keys())


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _get_table(rule_version: str) -> dict[str, Any]:
    """Fetch a registered rule table by version, raise KeyError if unknown."""
    if rule_version not in RULE_TABLE_REGISTRY:
        known = ", ".join(sorted(RULE_TABLE_REGISTRY.keys()))
        raise KeyError(f"Unknown rule_version {rule_version!r}. Known versions: {known}")
    return RULE_TABLE_REGISTRY[rule_version]
