"""
packages/shared-schema — single source of truth for EvidenceState,
Decision, and all evidence/result dataclasses.

Python code imports via the packages.shared_schema package (underscore),
which is a shim that loads compliance_engine.py from this directory.

See packages/shared_schema/__init__.py for the importable version.
"""
# This __init__.py intentionally has no imports; the canonical entry
# point for Python is packages/shared_schema/ (underscore directory).
