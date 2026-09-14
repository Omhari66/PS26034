"""
Shared pytest fixtures for PS 26034 test suite.

DB strategy: in-memory SQLite — no Postgres required to run the test suite.
All tables are created via Base.metadata.create_all at session start.

Auth strategy (Phase 6):
  The `client` fixture overrides get_current_user and require_supervisor to
  bypass JWT validation — all existing tests stay green without sending tokens.
  The `auth_client` fixture uses real JWT tokens for Phase 6 auth tests.

Usage in tests:
    def test_something(client):         # TestClient — auth bypassed, SQLite DB
    def test_something(auth_client):    # TestClient — real JWT required
    def test_something(db):             # raw SQLAlchemy session
"""

import os
import sys

# Patch sys.path so packages.shared_schema is importable from the test process.
_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
_backend_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
for _p in [_repo_root, _backend_root]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from app.db import Base, get_db  # noqa: E402
from app.dependencies.auth import get_current_user, require_supervisor  # noqa: E402
from app.services.auth_service import UserRecord  # noqa: E402
from main import app  # noqa: E402

_SQLITE_TEST_URL = "sqlite:///:memory:"

# ---------------------------------------------------------------------------
# Stub users — injected by the auth overrides below
# ---------------------------------------------------------------------------

_STUB_INSPECTOR = UserRecord(
    email="inspector@test",
    hashed_password="",
    role="inspector",
)
_STUB_SUPERVISOR = UserRecord(
    email="supervisor@test",
    hashed_password="",
    role="supervisor",
)


# ---------------------------------------------------------------------------
# DB fixtures
# ---------------------------------------------------------------------------


@pytest.fixture(scope="session")
def test_engine():
    """One shared in-memory SQLite engine for the whole test session."""
    engine = create_engine(
        _SQLITE_TEST_URL,
        connect_args={"check_same_thread": False},
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def db(test_engine):
    """Fresh transaction-isolated session per test, rolled back after."""
    connection = test_engine.connect()
    transaction = connection.begin()
    TestingSession = sessionmaker(bind=connection, autocommit=False, autoflush=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


# ---------------------------------------------------------------------------
# Client fixtures
# ---------------------------------------------------------------------------


@pytest.fixture()
def client(db):
    """
    FastAPI TestClient with:
      - get_db overridden → SQLite (no Postgres needed)
      - get_current_user overridden → stub inspector (no JWT needed)
      - require_supervisor overridden → stub supervisor (no role check)

    All existing tests use this fixture and continue to pass without tokens.
    """

    def override_get_db():
        yield db

    def override_get_current_user():
        return _STUB_INSPECTOR

    def override_require_supervisor():
        return _STUB_SUPERVISOR

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    app.dependency_overrides[require_supervisor] = override_require_supervisor
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def auth_client(db):
    """
    FastAPI TestClient with ONLY get_db overridden.
    JWT auth is fully enforced — used by Phase 6 auth tests.
    """

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()
