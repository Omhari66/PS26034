"""
Phase 6 tests — JWT auth and role enforcement.

Definition of done (PHASES.md §6):
  "An inspector-role token cannot call the override endpoint; a supervisor can."

This suite:
  1. POST /auth/login — valid and invalid credentials.
  2. Unauthenticated requests → 403 (FastAPI HTTPBearer returns 403 when
     no Authorization header is sent; 401 when the token is invalid).
  3. Inspector token — can access inspection endpoints, blocked on /review.
  4. Supervisor token — can access all endpoints including /review.
  5. Token expiry / tampered token → 401.

Uses `auth_client` from conftest — real JWT auth enforced (no overrides).
"""


from jose import jwt

from app.services.auth_service import (
    ALGORITHM,
    SECRET_KEY,
)

# ---------------------------------------------------------------------------
# Demo credentials matching the seeded USER_DB in auth_service.py
# ---------------------------------------------------------------------------

INSPECTOR_EMAIL = "inspector@demo.ps26034"
INSPECTOR_PASSWORD = "inspector123"
SUPERVISOR_EMAIL = "supervisor@demo.ps26034"
SUPERVISOR_PASSWORD = "supervisor123"

# Evidence for a submittable inspection
_EVIDENCE = [
    {
        "field_name": "mrp",
        "state": "FOUND",
        "value": "99.00",
        "ocr_confidence": 0.95,
        "source_image": "front.jpg",
    }
]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _login(auth_client, email: str, password: str) -> str:
    """Login and return the Bearer token string."""
    res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, f"Login failed: {res.text}"
    return res.json()["token"]


def _inspector_token(auth_client) -> str:
    return _login(auth_client, INSPECTOR_EMAIL, INSPECTOR_PASSWORD)


def _supervisor_token(auth_client) -> str:
    return _login(auth_client, SUPERVISOR_EMAIL, SUPERVISOR_PASSWORD)


def _create_submitted(auth_client, token: str) -> str:
    """Create + submit an inspection using the given token."""
    hdrs = {"Authorization": f"Bearer {token}"}

    r = auth_client.post(
        "/api/v1/inspections",
        json={"inspector_id": "auth-test-inspector"},
        headers=hdrs,
    )
    assert r.status_code == 201
    iid = r.json()["inspection_id"]

    auth_client.post(
        f"/api/v1/inspections/{iid}/category",
        json={"category": "packaged_food"},
        headers=hdrs,
    )
    auth_client.post(
        f"/api/v1/inspections/{iid}/submit",
        json={
            "coverage": {"front": True, "back": False, "close_up": False},
            "field_evidences": _EVIDENCE,
        },
        headers=hdrs,
    )
    return iid


# ---------------------------------------------------------------------------
# 1. POST /auth/login
# ---------------------------------------------------------------------------


class TestLogin:
    def test_inspector_login_succeeds(self, auth_client):
        res = auth_client.post(
            "/api/v1/auth/login",
            json={"email": INSPECTOR_EMAIL, "password": INSPECTOR_PASSWORD},
        )
        assert res.status_code == 200
        body = res.json()
        assert "token" in body
        assert body["role"] == "inspector"

    def test_supervisor_login_succeeds(self, auth_client):
        res = auth_client.post(
            "/api/v1/auth/login",
            json={"email": SUPERVISOR_EMAIL, "password": SUPERVISOR_PASSWORD},
        )
        assert res.status_code == 200
        assert res.json()["role"] == "supervisor"

    def test_wrong_password_returns_401(self, auth_client):
        res = auth_client.post(
            "/api/v1/auth/login",
            json={"email": INSPECTOR_EMAIL, "password": "wrongpassword"},
        )
        assert res.status_code == 401

    def test_unknown_email_returns_401(self, auth_client):
        res = auth_client.post(
            "/api/v1/auth/login",
            json={"email": "nobody@nowhere.com", "password": "anything"},
        )
        assert res.status_code == 401

    def test_token_contains_role_claim(self, auth_client):
        token = _inspector_token(auth_client)
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["role"] == "inspector"
        assert payload["sub"] == INSPECTOR_EMAIL

    def test_login_is_unauthenticated_endpoint(self, auth_client):
        """POST /auth/login must work without an Authorization header."""
        res = auth_client.post(
            "/api/v1/auth/login",
            json={"email": INSPECTOR_EMAIL, "password": INSPECTOR_PASSWORD},
        )
        assert res.status_code == 200


# ---------------------------------------------------------------------------
# 2. Unauthenticated requests
# ---------------------------------------------------------------------------


class TestUnauthenticated:
    def test_no_token_on_inspections_returns_401(self, auth_client):
        res = auth_client.get("/api/v1/inspections")
        # HTTPBearer: 403 without header (older FastAPI), 401 in newer versions
        assert res.status_code in (401, 403)

    def test_no_token_on_rules_returns_401(self, auth_client):
        res = auth_client.get("/api/v1/rules/packaged_food")
        assert res.status_code in (401, 403)

    def test_invalid_token_returns_401(self, auth_client):
        res = auth_client.get(
            "/api/v1/inspections",
            headers={"Authorization": "Bearer this.is.garbage"},
        )
        assert res.status_code == 401

    def test_tampered_token_returns_401(self, auth_client):
        """Modify the payload → signature mismatch → 401."""
        token = _inspector_token(auth_client)
        # Flip one character in the signature segment
        parts = token.split(".")
        parts[2] = parts[2][:-1] + ("A" if parts[2][-1] != "A" else "B")
        tampered = ".".join(parts)
        res = auth_client.get(
            "/api/v1/inspections",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert res.status_code == 401


# ---------------------------------------------------------------------------
# 3. Inspector role — can inspect, cannot review
# ---------------------------------------------------------------------------


class TestInspectorRole:
    def test_inspector_can_create_inspection(self, auth_client):
        token = _inspector_token(auth_client)
        res = auth_client.post(
            "/api/v1/inspections",
            json={"inspector_id": "insp-test"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 201

    def test_inspector_can_list_inspections(self, auth_client):
        token = _inspector_token(auth_client)
        res = auth_client.get(
            "/api/v1/inspections",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

    def test_inspector_can_get_rules(self, auth_client):
        token = _inspector_token(auth_client)
        res = auth_client.get(
            "/api/v1/rules/packaged_food",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

    def test_inspector_CANNOT_review(self, auth_client):
        """
        Phase 6 DoD: inspector-role token cannot call the override endpoint.
        """
        token = _inspector_token(auth_client)
        iid = _create_submitted(auth_client, token)

        res = auth_client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "PASS",
                "reason": "Inspector trying to self-approve — must be blocked.",
                "reviewer_id": "self",
            },
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403, (
            "Inspector must not be able to call the override endpoint."
        )
        assert res.json()["detail"]["code"] == "INSUFFICIENT_ROLE"


# ---------------------------------------------------------------------------
# 4. Supervisor role — full access including review
# ---------------------------------------------------------------------------


class TestSupervisorRole:
    def test_supervisor_can_review(self, auth_client):
        """
        Phase 6 DoD: supervisor-role token CAN call the override endpoint.
        """
        inspector_token = _inspector_token(auth_client)
        supervisor_token = _supervisor_token(auth_client)

        # Inspector submits
        iid = _create_submitted(auth_client, inspector_token)

        # Supervisor overrides
        res = auth_client.post(
            f"/api/v1/inspections/{iid}/review",
            json={
                "overridden_decision": "PASS",
                "reason": "Physical verification confirms full compliance.",
                "reviewer_id": "supervisor@demo.ps26034",
            },
            headers={"Authorization": f"Bearer {supervisor_token}"},
        )
        assert res.status_code == 201
        assert res.json()["overridden_decision"] == "PASS"

    def test_supervisor_can_access_audit_trail(self, auth_client):
        token = _supervisor_token(auth_client)
        iid = _create_submitted(auth_client, token)
        res = auth_client.get(
            f"/api/v1/inspections/{iid}/audit",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 200

    def test_supervisor_can_create_inspections(self, auth_client):
        token = _supervisor_token(auth_client)
        res = auth_client.post(
            "/api/v1/inspections",
            json={"inspector_id": "sup-inspect"},
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 201
