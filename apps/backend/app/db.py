"""
Database configuration — SQLAlchemy engine + session factory + Base.

Tests override get_db() via FastAPI dependency injection to use an
in-memory SQLite database; no Postgres required to run the test suite.
"""

import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# Load .env from the apps/backend directory
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./dev.db")

# SQLite needs check_same_thread=False; Postgres ignores this kwarg.
_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=_connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """SQLAlchemy declarative base — all ORM models inherit from this."""


def get_db():
    """
    FastAPI dependency that yields a database session per request.
    Override in tests with app.dependency_overrides[get_db] = test_get_db.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
