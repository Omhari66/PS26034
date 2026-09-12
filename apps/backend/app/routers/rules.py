"""
Rules API — GET /rules/{category}

Allows the mobile app and dashboard to display the active rule set
for transparency (which fields are required, what the legal basis is).
Also used by the applicability engine at submit time.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.dependencies.auth import get_current_user
from app.services.applicability import (
    CURRENT_RULE_VERSION,
    get_rules,
    list_rule_versions,
    list_supported_categories,
)

router = APIRouter(
    prefix="/rules",
    tags=["rules"],
    dependencies=[Depends(get_current_user)],
)


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class FieldRuleOut(BaseModel):
    rule_id: str
    field: str
    declaration: str
    legal_ref: str
    description: str
    required: bool


class CategoryRulesOut(BaseModel):
    rule_version: str
    category: str
    label: str
    supported: bool
    fields: list[FieldRuleOut]
    notes: str


class RuleVersionsOut(BaseModel):
    current_rule_version: str
    available_versions: list[str]
    supported_categories: list[str]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.get(
    "/{category}",
    response_model=CategoryRulesOut,
    summary="Get the active rule set for a product category",
)
def get_category_rules(
    category: str,
    rule_version: str | None = None,
) -> CategoryRulesOut:
    """
    Returns which fields are required (and their legal references) for
    the given category under the specified rule version.

    - If `rule_version` is omitted, the current active version is used.
    - If the category is not supported, returns supported=false with an
      empty fields list (not a 404 — the caller can display a clear message).
    """
    version = rule_version or CURRENT_RULE_VERSION
    if version not in list_rule_versions():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "RULE_VERSION_NOT_FOUND",
                "message": f"rule_version '{version}' is not registered.",
                "available": list_rule_versions(),
            },
        )
    cat_rules = get_rules(category, rule_version=version)
    return CategoryRulesOut(
        rule_version=cat_rules.rule_version,
        category=cat_rules.category,
        label=cat_rules.label,
        supported=cat_rules.supported,
        fields=[
            FieldRuleOut(
                rule_id=fr.rule_id,
                field=fr.field,
                declaration=fr.declaration,
                legal_ref=fr.legal_ref,
                description=fr.description,
                required=fr.required,
            )
            for fr in cat_rules.fields
        ],
        notes=cat_rules.notes,
    )


@router.get(
    "",
    response_model=RuleVersionsOut,
    summary="List all registered rule versions and supported categories",
)
def list_versions() -> RuleVersionsOut:
    """Returns the current rule version, all registered versions, and supported categories."""
    return RuleVersionsOut(
        current_rule_version=CURRENT_RULE_VERSION,
        available_versions=list_rule_versions(),
        supported_categories=list_supported_categories(),
    )
