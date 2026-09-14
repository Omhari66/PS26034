"""
packages/shared_schema — Python-importable package.

The canonical source files live in packages/shared-schema/ (hyphen,
for Node/pnpm compatibility). This package re-exports them so that
Python code can use:

    from packages.shared_schema import EvidenceState, Decision, ...

The hyphen directory is the single source of truth for compliance_engine.py
and the TypeScript mirror. Do not add logic here — only re-exports.
"""

import importlib.util
import os
import sys


def _load_from_hyphen_dir():
    """
    Dynamically load compliance_engine from packages/shared-schema/
    (the hyphen directory that Python cannot import directly).
    """
    _here = os.path.dirname(__file__)
    _engine_path = os.path.abspath(
        os.path.join(_here, "..", "shared-schema", "compliance_engine.py")
    )
    spec = importlib.util.spec_from_file_location(
        "packages.shared_schema.compliance_engine", _engine_path
    )
    module = importlib.util.module_from_spec(spec)
    sys.modules["packages.shared_schema.compliance_engine"] = module
    spec.loader.exec_module(module)
    return module


_engine = _load_from_hyphen_dir()

# Re-export all public symbols
EvidenceState = _engine.EvidenceState
Decision = _engine.Decision
FieldEvidence = _engine.FieldEvidence
FieldRule = _engine.FieldRule
RuleResult = _engine.RuleResult
InspectionReport = _engine.InspectionReport
evaluate_field = _engine.evaluate_field
aggregate_overall = _engine.aggregate_overall
build_report = _engine.build_report
CONF_THRESHOLD = _engine.CONF_THRESHOLD
# Validator functions — importable for wiring and testing
validate_mrp = _engine.validate_mrp
validate_quantity = _engine.validate_quantity
validate_date = _engine.validate_date
validate_manufacturer = _engine.validate_manufacturer
validate_consumer_care = _engine.validate_consumer_care

__all__ = [
    "CONF_THRESHOLD",
    "Decision",
    "EvidenceState",
    "FieldEvidence",
    "FieldRule",
    "InspectionReport",
    "RuleResult",
    "aggregate_overall",
    "build_report",
    "evaluate_field",
    "validate_consumer_care",
    "validate_date",
    "validate_manufacturer",
    "validate_mrp",
    "validate_quantity",
]
