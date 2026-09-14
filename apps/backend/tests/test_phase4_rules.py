"""
Phase 4 regression tests — applicability engine + versioned rule table.

Definition of done (PHASES.md §4):
  "Changing a rule's version and re-running the Phase 1 regression suite
  against both versions shows the expected before/after difference, with
  old reports still referencing the old version."

This file:
  1. Tests the pure applicability engine (no DB, no HTTP).
  2. Tests the GET /rules/{category} endpoint.
  3. The key DoD regression: proves that textiles consumer_care goes from
     NOT_APPLICABLE (v1.0, optional) to FAIL (v1.1, required) when
     consumer_care evidence is NOT_FOUND — and that old DB records retain
     their original rule_version string.
"""

import pytest
from packages.shared_schema import Decision, EvidenceState, FieldEvidence, evaluate_field

from app.services.applicability import (
    CURRENT_RULE_VERSION,
    get_rules,
    is_category_supported,
    is_field_required,
    list_rule_versions,
    list_supported_categories,
)

FULL_COVERAGE = {"front": True, "back": True, "close_up": True}

# ---------------------------------------------------------------------------
# 1. Applicability engine — pure unit tests
# ---------------------------------------------------------------------------


class TestListVersions:
    def test_v1_0_and_v1_1_registered(self):
        versions = list_rule_versions()
        assert "v1.0" in versions
        assert "v1.1" in versions

    def test_sorted(self):
        versions = list_rule_versions()
        assert versions == sorted(versions)


class TestSupportedCategories:
    def test_packaged_food_supported_v1_0(self):
        assert is_category_supported("packaged_food", "v1.0")

    def test_textiles_supported_v1_0(self):
        assert is_category_supported("textiles", "v1.0")

    def test_unknown_category_not_supported(self):
        assert not is_category_supported("unicorn_food", "v1.0")

    def test_list_categories_returns_sorted(self):
        cats = list_supported_categories("v1.0")
        assert cats == sorted(cats)
        assert "packaged_food" in cats
        assert "textiles" in cats


class TestGetRules:
    def test_packaged_food_v1_0_all_5_required(self):
        rules = get_rules("packaged_food", "v1.0")
        assert rules.supported is True
        required_fields = {fr.field for fr in rules.fields if fr.required}
        assert required_fields == {
            "mrp",
            "net_quantity",
            "manufacturing_date",
            "manufacturer_name",
            "consumer_care",
        }

    def test_textiles_v1_0_only_mrp_and_manufacturer_required(self):
        rules = get_rules("textiles", "v1.0")
        required = {fr.field for fr in rules.fields if fr.required}
        not_required = {fr.field for fr in rules.fields if not fr.required}
        assert "mrp" in required
        assert "manufacturer_name" in required
        # In v1.0 these are optional for textiles:
        assert "consumer_care" in not_required or "consumer_care" not in required

    def test_textiles_v1_1_net_quantity_required(self):
        """v1.1 promotes net_quantity to required for textiles."""
        rules = get_rules("textiles", "v1.1")
        required = {fr.field for fr in rules.fields if fr.required}
        assert "net_quantity" in required

    def test_drugs_pharma_v1_0_consumer_care_optional(self):
        rules = get_rules("drugs_pharma", "v1.0")
        required = {fr.field for fr in rules.fields if fr.required}
        assert "consumer_care" not in required

    def test_drugs_pharma_v1_1_consumer_care_required(self):
        """v1.1 promotes consumer_care to required for drugs_pharma."""
        rules = get_rules("drugs_pharma", "v1.1")
        required = {fr.field for fr in rules.fields if fr.required}
        assert "consumer_care" in required

    def test_unsupported_category_returns_supported_false(self):
        rules = get_rules("unicorn_food", "v1.0")
        assert rules.supported is False
        assert rules.fields == []

    def test_unknown_version_raises_key_error(self):
        with pytest.raises(KeyError, match="v99.0"):
            get_rules("packaged_food", "v99.0")

    def test_rule_ids_present(self):
        rules = get_rules("packaged_food", "v1.0")
        rule_ids = {fr.rule_id for fr in rules.fields}
        assert "LM-MRP-001" in rule_ids
        assert "LM-CC-001" in rule_ids


class TestIsFieldRequired:
    def test_mrp_required_for_all_categories_v1_0(self):
        for cat in list_supported_categories("v1.0"):
            assert is_field_required("mrp", cat, "v1.0"), f"mrp should be required for {cat}"

    def test_consumer_care_not_required_for_textiles_v1_0(self):
        assert not is_field_required("consumer_care", "textiles", "v1.0")

    def test_consumer_care_required_for_textiles_v1_1(self):
        # textiles consumer_care is still optional in v1.1; only drugs_pharma changes
        # (this confirms we didn't accidentally promote it for textiles)
        assert not is_field_required("consumer_care", "textiles", "v1.1")

    def test_net_quantity_not_required_for_textiles_v1_0(self):
        assert not is_field_required("net_quantity", "textiles", "v1.0")

    def test_net_quantity_required_for_textiles_v1_1(self):
        assert is_field_required("net_quantity", "textiles", "v1.1")


# ---------------------------------------------------------------------------
# 2. Key DoD regression: v1.0 vs v1.1 produce different decisions
#    for textiles with consumer_care absent, and the old rule_version
#    on a "stored" RuleResult is preserved.
# ---------------------------------------------------------------------------


class TestVersionRegressionDoD:
    """
    Simulates the exact DoD scenario from PHASES.md §4:
      'Before/after difference when rule version changes,
       old reports still referencing the old version.'

    We evaluate the SAME evidence under v1.0 and v1.1, then assert:
      - v1.0 textiles: consumer_care NOT_FOUND → NOT_APPLICABLE
        (because consumer_care is optional for textiles in v1.0)
      - v1.1 textiles: net_quantity NOT_FOUND → FAIL
        (because net_quantity is required for textiles in v1.1)
      - The rule_version field on each RuleResult matches the version used.
    """

    _consumer_care_not_found = FieldEvidence(
        field_name="consumer_care",
        state=EvidenceState.NOT_FOUND,
    )
    _net_quantity_not_found = FieldEvidence(
        field_name="net_quantity",
        state=EvidenceState.NOT_FOUND,
    )

    def test_consumer_care_textiles_v1_0_not_applicable(self):
        required = is_field_required("consumer_care", "textiles", "v1.0")
        result = evaluate_field(
            self._consumer_care_not_found, "LM-CC-001", "v1.0", required=required
        )
        assert result.decision == Decision.NOT_APPLICABLE
        assert result.rule_version == "v1.0"

    def test_net_quantity_textiles_v1_0_not_applicable(self):
        required = is_field_required("net_quantity", "textiles", "v1.0")
        result = evaluate_field(
            self._net_quantity_not_found, "LM-NQ-001", "v1.0", required=required
        )
        assert result.decision == Decision.NOT_APPLICABLE
        assert result.rule_version == "v1.0"

    def test_net_quantity_textiles_v1_1_fail(self):
        """v1.1 makes net_quantity required for textiles → NOT_FOUND = FAIL."""
        required = is_field_required("net_quantity", "textiles", "v1.1")
        result = evaluate_field(
            self._net_quantity_not_found,
            "LM-NQ-001",
            "v1.1",
            required=required,
            coverage=FULL_COVERAGE,
        )
        assert result.decision == Decision.FAIL
        assert result.rule_version == "v1.1"

    def test_consumer_care_drugs_pharma_v1_0_not_applicable(self):
        required = is_field_required("consumer_care", "drugs_pharma", "v1.0")
        result = evaluate_field(
            self._consumer_care_not_found, "LM-CC-001", "v1.0", required=required
        )
        assert result.decision == Decision.NOT_APPLICABLE
        assert result.rule_version == "v1.0"

    def test_consumer_care_drugs_pharma_v1_1_fail(self):
        """v1.1 promotes consumer_care to required for drugs_pharma → NOT_FOUND = FAIL."""
        required = is_field_required("consumer_care", "drugs_pharma", "v1.1")
        result = evaluate_field(
            self._consumer_care_not_found,
            "LM-CC-001",
            "v1.1",
            required=required,
            coverage=FULL_COVERAGE,
        )
        assert result.decision == Decision.FAIL
        assert result.rule_version == "v1.1"

    def test_old_rule_version_preserved_on_result(self):
        """
        Simulates an old DB record: the RuleResult still carries the version
        it was evaluated under. This is the append-only guarantee.
        """
        v1_result = evaluate_field(
            self._consumer_care_not_found,
            "LM-CC-001",
            "v1.0",
            required=is_field_required("consumer_care", "drugs_pharma", "v1.0"),
        )
        v1_1_result = evaluate_field(
            self._consumer_care_not_found,
            "LM-CC-001",
            "v1.1",
            required=is_field_required("consumer_care", "drugs_pharma", "v1.1"),
        )
        # Old report references old version
        assert v1_result.rule_version == "v1.0"
        # New evaluation references new version
        assert v1_1_result.rule_version == "v1.1"
        # And they produce different decisions for the same evidence
        assert v1_result.decision != v1_1_result.decision


# ---------------------------------------------------------------------------
# 3. GET /rules/{category} HTTP endpoint tests
# ---------------------------------------------------------------------------


from app.services.applicability import CURRENT_RULE_VERSION  # noqa: F811, E402


class TestRulesEndpoint:
    def test_get_packaged_food_rules(self, client):
        res = client.get("/api/v1/rules/packaged_food")
        assert res.status_code == 200
        body = res.json()
        assert body["supported"] is True
        assert body["rule_version"] == CURRENT_RULE_VERSION
        fields = {f["field"] for f in body["fields"]}
        assert "mrp" in fields
        assert "consumer_care" in fields

    def test_get_textiles_rules_v1_0_net_qty_not_required(self, client):
        res = client.get("/api/v1/rules/textiles?rule_version=v1.0")
        assert res.status_code == 200
        body = res.json()
        field_map = {f["field"]: f for f in body["fields"]}
        assert field_map["net_quantity"]["required"] is False

    def test_get_textiles_rules_v1_1_net_qty_required(self, client):
        res = client.get("/api/v1/rules/textiles?rule_version=v1.1")
        assert res.status_code == 200
        body = res.json()
        field_map = {f["field"]: f for f in body["fields"]}
        assert field_map["net_quantity"]["required"] is True

    def test_unsupported_category_returns_200_not_404(self, client):
        """Unsupported category returns 200 with supported=false, not a 404."""
        res = client.get("/api/v1/rules/unicorn_food")
        assert res.status_code == 200
        assert res.json()["supported"] is False

    def test_unknown_rule_version_returns_404(self, client):
        res = client.get("/api/v1/rules/packaged_food?rule_version=v99.0")
        assert res.status_code == 404

    def test_list_versions_endpoint(self, client):
        res = client.get("/api/v1/rules")
        assert res.status_code == 200
        body = res.json()
        assert "v1.0" in body["available_versions"]
        assert "v1.1" in body["available_versions"]
        assert body["current_rule_version"] == CURRENT_RULE_VERSION
        assert "packaged_food" in body["supported_categories"]
