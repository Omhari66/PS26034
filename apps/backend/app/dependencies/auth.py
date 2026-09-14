"""
FastAPI dependency — extract and validate the current user from
the Authorization: Bearer <token> header.

Provides:
  - get_current_user(token)  → UserRecord (any valid token)
  - require_supervisor(user) → UserRecord (raises 403 if role != supervisor)

Usage in route handlers:
    @router.post("/{id}/review")
    def create_review(
        ...,
        current_user: UserRecord = Depends(require_supervisor),
    ):

Phase 6 note: auth is enforced on all endpoints. The only unauthenticated
endpoint is POST /auth/login itself.
"""

from __future__ import annotations

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth_service import UserRecord, decode_token, get_user

_bearer = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> UserRecord:
    """
    Validates the Bearer token and returns the associated UserRecord.
    Raises HTTP 401 if the token is missing, malformed, expired, or the
    user no longer exists in the user store.
    """
    _credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "code": "INVALID_TOKEN",
            "message": "Could not validate credentials.",
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_token(credentials.credentials)
        email: str | None = payload.get("sub")
        if email is None:
            raise _credentials_exception
    except Exception:
        raise _credentials_exception

    user = get_user(email)
    if user is None:
        raise _credentials_exception
    return user


def require_supervisor(
    current_user: UserRecord = Depends(get_current_user),
) -> UserRecord:
    """
    Extends get_current_user — additionally asserts role == 'supervisor'.
    Raises HTTP 403 if the user is authenticated but not a supervisor.

    Phase 6 DoD: an inspector-role token cannot call the override endpoint.
    """
    if current_user.role != "supervisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "INSUFFICIENT_ROLE",
                "message": (f"Role 'supervisor' required. Your role: '{current_user.role}'."),
            },
        )
    return current_user
