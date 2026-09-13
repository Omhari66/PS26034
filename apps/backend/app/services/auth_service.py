"""
Auth service — JWT creation and validation for PS 26034.

Two roles:
  - inspector    — can create inspections, upload images, set category, submit.
  - supervisor   — all inspector permissions + review/override.

Security design:
  - HS256 JWT signed with a SECRET_KEY loaded from the environment.
  - Tokens expire after ACCESS_TOKEN_EXPIRE_MINUTES (default 480 = 8 h).
  - Passwords hashed with bcrypt (direct, no passlib wrapper).
  - Demo users are seeded in memory (replaced by a DB table in production).

Phase 6 stub note:
  # TODO(production): replace the in-memory USER_DB dict with a real users
  # table + proper registration flow. The crypto logic here is production-
  # grade; only the user store is demo-quality.
"""

from __future__ import annotations

import os
from datetime import UTC, datetime, timedelta
from typing import Any

import bcrypt
from jose import jwt

# ---------------------------------------------------------------------------
# Config — read from environment; safe defaults for demo / tests
# ---------------------------------------------------------------------------

SECRET_KEY: str = os.environ.get(
    "PS26034_SECRET_KEY",
    "CHANGE_ME_before_production_this_is_only_for_demo",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.environ.get("ACCESS_TOKEN_EXPIRE_MINUTES", "480"))

# ---------------------------------------------------------------------------
# Password hashing — using bcrypt directly (avoids passlib wrap-bug check
# that fails on Python 3.14 / bcrypt 5.x).
# ---------------------------------------------------------------------------


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def get_password_hash(plain: str) -> str:
    return bcrypt.hashpw(plain.encode(), bcrypt.gensalt()).decode()


# ---------------------------------------------------------------------------
# Demo user store
# # TODO(production): replace with a real DB-backed users table.
# ---------------------------------------------------------------------------


class UserRecord:
    def __init__(self, email: str, hashed_password: str, role: str):
        self.email = email
        self.hashed_password = hashed_password
        self.role = role  # "inspector" | "supervisor"


# Seeded demo accounts.  Passwords are bcrypt-hashed at module load time.
USER_DB: dict[str, UserRecord] = {
    "inspector@demo.ps26034": UserRecord(
        email="inspector@demo.ps26034",
        hashed_password=get_password_hash("inspector123"),
        role="inspector",
    ),
    "supervisor@demo.ps26034": UserRecord(
        email="supervisor@demo.ps26034",
        hashed_password=get_password_hash("supervisor123"),
        role="supervisor",
    ),
}


def get_user(email: str) -> UserRecord | None:
    return USER_DB.get(email)


def authenticate_user(email: str, password: str) -> UserRecord | None:
    user = get_user(email)
    if user is None:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    return user


# ---------------------------------------------------------------------------
# Token creation and decoding
# ---------------------------------------------------------------------------


def create_access_token(data: dict[str, Any]) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(UTC) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict[str, Any]:
    """
    Decode and validate a JWT.
    Raises jose.JWTError if the token is invalid or expired.
    """
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
