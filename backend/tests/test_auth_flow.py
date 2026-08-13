"""인증 흐름 통합 테스트 — 동의·레이트리밋·토큰 무효화·탈퇴·default-deny."""
import uuid

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    # lifespan을 태워 route_guard 검사와 스키마 마이그레이션까지 돌린다.
    with TestClient(app) as c:
        yield c


def _email() -> str:
    return f"u{uuid.uuid4().hex[:12]}@example.com"


VALID_PW = "seoul-rainy-tuesday-42"


def _signup(client, email=None, **overrides):
    body = {
        "email": email or _email(),
        "password": VALID_PW,
        # 만 14세 이상이어야 가입된다 (제22조의2).
        "birth_date": "1999-03-20",
        "consent_privacy": True,
        "consent_overseas": True,
    }
    body.update(overrides)
    return client.post("/api/auth/signup", json=body)


# ─────────────────────────── default-deny ───────────────────────────

def test_app_boots_with_all_routes_protected(client):
    """route_guard가 통과해야 앱이 뜬다. 여기 도달했다면 검사를 통과한 것."""
    assert client.get("/health").status_code == 200


def test_protected_endpoint_rejects_without_token(client):
    assert client.get("/api/me/sessions").status_code == 401
    assert client.get("/api/auth/me").status_code == 401


def test_protected_endpoint_rejects_garbage_token(client):
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer not-a-jwt"})
    assert r.status_code == 401


# ─────────────────────────── 동의 (제15·22·28조의8) ───────────────────────────

def test_signup_requires_privacy_consent(client):
    r = _signup(client, consent_privacy=False)
    assert r.status_code == 400
    assert "동의" in r.json()["detail"]


def test_signup_requires_separate_overseas_consent(client):
    """국외이전은 별도 동의 항목이어야 한다 (제28조의8)."""
    r = _signup(client, consent_overseas=False)
    assert r.status_code == 400
    assert "국외이전" in r.json()["detail"]


def test_signup_records_consent_history(client):
    email = _email()
    assert _signup(client, email).status_code == 201

    from app.db.database import SessionLocal
    from app.db.models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        assert user is not None
        assert user.consented_at is not None
        assert user.consent_version is not None
        assert user.overseas_consented_at is not None
    finally:
        db.close()


# ─────────────────────── 만 14세 미만 (제22조의2) ───────────────────────

def test_signup_rejects_under_fourteen(client):
    from datetime import date, timedelta

    # 오늘 기준 만 10세
    child = date.today().replace(year=date.today().year - 10) + timedelta(days=1)
    r = _signup(client, birth_date=child.isoformat())
    assert r.status_code == 400
    assert "14세" in r.json()["detail"]


def test_signup_requires_birth_date(client):
    body = {
        "email": _email(),
        "password": VALID_PW,
        "consent_privacy": True,
        "consent_overseas": True,
    }
    r = client.post("/api/auth/signup", json=body)
    assert r.status_code == 422  # 필수 필드 누락


def test_birth_date_is_not_stored(client):
    """생년월일은 확인에만 쓰고 저장하지 않아야 한다 (제16조 최소수집).

    저장하는 것은 '확인을 마친 시각'뿐이다.
    """
    email = _email()
    assert _signup(client, email).status_code == 201

    from app.db.database import SessionLocal
    from app.db.models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        assert user.age_verified_at is not None, "확인 시각은 남아야 함"
        # 생년월일을 담을 컬럼 자체가 존재하면 안 된다
        assert not hasattr(user, "birth_date"), "생년월일이 저장되고 있음"
    finally:
        db.close()


# ─────────────────────────── 비밀번호 정책 ───────────────────────────

def test_signup_rejects_short_password(client):
    r = _signup(client, password="short1")
    assert r.status_code == 422  # pydantic 스키마에서 걸림


def test_signup_rejects_common_password(client):
    r = _signup(client, password="password123")
    assert r.status_code == 400
    assert "흔하게" in r.json()["detail"]


# ─────────────────────────── 레이트리밋 ───────────────────────────

def test_login_rate_limit_kicks_in(client):
    from app.services import rate_limit

    email = _email()
    assert _signup(client, email).status_code == 201

    # 무료 시도 구간을 소진시킨다
    for _ in range(rate_limit.FREE_ATTEMPTS):
        r = client.post(
            "/api/auth/login", json={"email": email, "password": "wrong-password-xyz"}
        )
        assert r.status_code == 401

    # 다음 시도는 429여야 한다
    r = client.post(
        "/api/auth/login", json={"email": email, "password": "wrong-password-xyz"}
    )
    assert r.status_code == 429
    assert "Retry-After" in r.headers


def test_login_error_message_does_not_leak_account_existence(client):
    """존재하는 계정과 없는 계정의 오류 메시지가 같아야 한다."""
    email = _email()
    _signup(client, email)

    r_existing = client.post(
        "/api/auth/login", json={"email": email, "password": "wrong-password-xyz"}
    )
    r_missing = client.post(
        "/api/auth/login",
        json={"email": _email(), "password": "wrong-password-xyz"},
    )
    assert r_existing.json()["detail"] == r_missing.json()["detail"]


# ─────────────────────────── 토큰 무효화 ───────────────────────────

def test_logout_invalidates_existing_token(client):
    token = _signup(client).json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    assert client.get("/api/auth/me", headers=auth).status_code == 200
    assert client.post("/api/auth/logout", headers=auth).status_code == 204
    # 같은 토큰이 더 이상 통하면 안 된다 — localStorage를 지우는 것만으로는
    # 탈취된 토큰을 막을 수 없기 때문.
    assert client.get("/api/auth/me", headers=auth).status_code == 401


# ─────────────────────────── 탈퇴 (제37조·제21조) ───────────────────────────

def test_delete_account_removes_user_and_invalidates_token(client):
    email = _email()
    token = _signup(client, email).json()["access_token"]
    auth = {"Authorization": f"Bearer {token}"}

    assert client.delete("/api/auth/me", headers=auth).status_code == 204
    assert client.get("/api/auth/me", headers=auth).status_code == 401

    from app.db.database import SessionLocal
    from app.db.models import User

    db = SessionLocal()
    try:
        assert db.query(User).filter(User.email == email).first() is None
    finally:
        db.close()


def test_deleted_account_cannot_login(client):
    email = _email()
    token = _signup(client, email).json()["access_token"]
    client.delete("/api/auth/me", headers={"Authorization": f"Bearer {token}"})

    r = client.post("/api/auth/login", json={"email": email, "password": VALID_PW})
    assert r.status_code == 401
