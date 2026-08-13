"""default-deny 가드가 실제로 동작하는지 확인.

본 앱이 부팅된다는 사실만으로는 가드가 '작동한다'를 증명하지 못한다
(가드가 항상 통과만 해도 부팅은 된다). 그래서 일부러 미보호 라우트를 만든
앱을 넣어 예외가 나는지 확인한다.
"""
import pytest
from fastapi import Depends, FastAPI

from app.core.deps import get_current_user
from app.core.route_guard import assert_all_routes_protected


def test_guard_rejects_unprotected_route():
    app = FastAPI()

    @app.get("/api/secret-data")
    def leaky():  # 인증 의존성 없음 — 잡혀야 한다
        return {"secret": True}

    with pytest.raises(RuntimeError) as exc:
        assert_all_routes_protected(app, get_current_user)
    assert "/api/secret-data" in str(exc.value)


def test_guard_accepts_route_with_function_level_auth():
    app = FastAPI()

    @app.get("/api/mine")
    def mine(user=Depends(get_current_user)):
        return {"ok": True}

    assert_all_routes_protected(app, get_current_user)  # 예외 없어야 함


def test_guard_accepts_route_with_router_level_auth():
    """router-level dependency만으로도 보호된 것으로 인정되어야 한다."""
    from fastapi import APIRouter

    app = FastAPI()
    router = APIRouter(dependencies=[Depends(get_current_user)])

    @router.get("/api/via-router")
    def via_router():
        return {"ok": True}

    app.include_router(router)
    assert_all_routes_protected(app, get_current_user)


def test_guard_allows_explicitly_public_paths():
    app = FastAPI()

    @app.get("/health")
    def health():
        return {"status": "ok"}

    assert_all_routes_protected(app, get_current_user)


def test_real_app_has_expected_public_surface():
    """공개 엔드포인트가 의도치 않게 늘어나지 않았는지 고정한다."""
    from app.core.route_guard import PUBLIC_PATHS

    # 인증 없이 접근 가능한 API는 이 셋뿐이어야 한다.
    api_public = {p for p in PUBLIC_PATHS if p.startswith("/api/")}
    assert api_public == {"/api/auth/signup", "/api/auth/login"}
