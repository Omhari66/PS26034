"""
Auth router — POST /auth/login

Returns a JWT that all other endpoints require via
  Authorization: Bearer <token>

Rate-limiting and brute-force protection are out of Phase 6 scope.
# TODO(production): add rate limiting (e.g. slowapi) before deployment.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.services.auth_service import authenticate_user, create_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    role: str   # "inspector" | "supervisor"
    email: str


@router.post(
    "/login",
    response_model=LoginResponse,
    summary="Authenticate and receive a JWT",
)
def login(body: LoginRequest) -> LoginResponse:
    """
    POST /auth/login — only unauthenticated endpoint.
    Returns a Bearer token containing the user's role as a claim.
    """
    user = authenticate_user(body.email, body.password)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Incorrect email or password.",
            },
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = create_access_token({"sub": user.email, "role": user.role})
    return LoginResponse(token=token, role=user.role, email=user.email)
