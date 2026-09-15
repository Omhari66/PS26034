"""
Phase 0 smoke test: compliance_engine.py runs from its new location
(packages/shared-schema/) without errors.

This test satisfies the Phase 0 Definition of Done:
  "compliance_engine.py's existing smoke test still passes from its new location."
"""

import os
import subprocess
import sys


def test_compliance_engine_smoke():
    """
    Run compliance_engine.py as __main__ and assert it exits 0.
    Output is checked for the expected OVERALL: REVIEW line
    (the existing smoke test produces REVIEW because consumer_care is NOT_VERIFIABLE).
    """
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    engine_path = os.path.join(repo_root, "packages", "shared-schema", "compliance_engine.py")

    result = subprocess.run(
        [sys.executable, engine_path],
        capture_output=True,
        text=True,
        encoding="utf-8",
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
        cwd=repo_root,
    )

    assert result.returncode == 0, (
        f"compliance_engine.py smoke test failed.\nstdout: {result.stdout}\nstderr: {result.stderr}"
    )
    assert "OVERALL: REVIEW" in result.stdout, (
        f"Expected 'OVERALL: REVIEW' in smoke test output.\nGot: {result.stdout}"
    )
    assert "mrp" in result.stdout, "Expected mrp field in smoke test output."


def test_shared_schema_import():
    """
    Confirm packages.shared_schema imports cleanly and exports the expected symbols.
    This catches any __init__.py misconfiguration early.
    """
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
    if repo_root not in sys.path:
        sys.path.insert(0, repo_root)

    from packages.shared_schema import (
        Decision,
        EvidenceState,
    )

    # Verify string values match exactly — the TS mirror depends on these
    assert EvidenceState.FOUND == "FOUND"
    assert EvidenceState.NOT_FOUND == "NOT_FOUND"
    assert EvidenceState.NOT_VERIFIABLE == "NOT_VERIFIABLE"
    assert EvidenceState.CONFLICTING == "CONFLICTING"

    assert Decision.PASS == "PASS"
    assert Decision.FAIL == "FAIL"
    assert Decision.REVIEW == "REVIEW"
    assert Decision.NOT_APPLICABLE == "NOT_APPLICABLE"
    assert Decision.CATEGORY_NOT_SUPPORTED == "CATEGORY_NOT_SUPPORTED"
