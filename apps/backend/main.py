"""
PS 26034 backend — FastAPI application entry point.

Phase 0: /health skeleton.
Phase 1: /api/v1/inspections — rule engine wired, DB-backed, no OCR.
Phase 2: OCR integration (image upload + pipeline).
Phase 3: mobile-facing submit flow.
Phase 4: /api/v1/rules — versioned rule table + applicability engine.
Phase 5: dashboard endpoints (list, review, audit trail).
Phase 6: JWT auth — /auth/login + role-gated endpoints.
Phase 7: demo polish — health enrichment, auto-table-create for dev/demo.
"""

import os
import sys
from contextlib import asynccontextmanager

# Make packages/ importable when running from apps/backend or from repo root.
# In production, install packages/shared-schema as a proper local package.
_repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _repo_root not in sys.path:
    sys.path.append(_repo_root)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from packages.shared_schema import Decision, EvidenceState  # noqa: E402, F401

from app.db import Base, engine  # noqa: E402
from app.routers import auth, inspections, rules  # noqa: E402
from app.services.applicability import CURRENT_RULE_VERSION  # noqa: E402


@asynccontextmanager
async def lifespan(_app: FastAPI):
    """
    Dev / demo only: auto-create DB tables so `uv run uvicorn main:app`
    works out of the box with SQLite without running Alembic migrations.

    Production (PostgreSQL): set ENVIRONMENT=production and run
    `alembic upgrade head` in the deploy pipeline instead.
    """
    env = os.environ.get("ENVIRONMENT", "dev")
    if env in ("dev", "demo"):
        Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="PS 26034 — Legal Metrology Inspection API",
    description=(
        "AI-assisted packaging compliance inspection backend. "
        "See API_CONTRACT.md for the full endpoint spec."
    ),
    version="0.6.0",
    lifespan=lifespan,
)

# CORS — allow the dashboard (3000) and Expo dev server (8081/19000) in dev.
# Must be registered before routers so preflight OPTIONS requests are handled.
# TODO(production): replace allow_origins with the real deployed domain.
_CORS_ORIGINS = [
    "http://localhost:3000",   # Next.js dashboard
    "http://127.0.0.1:3000",
    "http://localhost:8081",   # Expo web
    "http://localhost:19000",  # Expo DevTools
    "exp://localhost:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from pathlib import Path  # noqa: E402
from fastapi.staticfiles import StaticFiles  # noqa: E402

# Mount static images directory for web dashboard evidence viewer
_images_dir = Path(__file__).parent / "app" / "data" / "images"
_images_dir.mkdir(parents=True, exist_ok=True)
app.mount("/static/images", StaticFiles(directory=str(_images_dir)), name="static_images")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(inspections.router, prefix="/api/v1")
app.include_router(rules.router, prefix="/api/v1")


@app.get("/health", tags=["meta"])
def health() -> JSONResponse:
    """
    Liveness + readiness check.
    Returns version, environment, current rule version, and DB status.
    Safe to call without auth — used by demo runbook and monitoring.
    """
    db_ok = True
    try:
        with engine.connect():
            pass
    except Exception:
        db_ok = False

    return JSONResponse({
        "status": "ok",
        "service": "ps26034-backend",
        "version": "0.6.0",
        "environment": os.environ.get("ENVIRONMENT", "dev"),
        "current_rule_version": CURRENT_RULE_VERSION,
        "supported_phases": "0-7",
        "db": "ok" if db_ok else "error",
    })
