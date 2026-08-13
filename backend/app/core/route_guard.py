"""인증 default-deny 보장 장치.

배경: 각 라우트가 개별적으로 Depends(get_current_user)를 붙이는 방식은
새 엔드포인트를 추가하면서 깜빡하면 그대로 인증 없이 열린다.
Rego에서 `default allow = false`를 명시하지 않으면 정책이 통과되어 버리는 것과
같은 실수 유형이다.

두 겹으로 막는다:
1. 보호 라우터에 router-level dependency를 걸어 새 엔드포인트가 기본으로 보호되게 함
   (app/api/*.py의 APIRouter(dependencies=[...]) 참고)
2. 부팅 시 전체 라우트를 훑어 '공개 목록에 없는데 인증도 없는' 라우트가 있으면
   앱을 띄우지 않는다. 실수를 런타임이 아니라 개발 시점에 터뜨리는 게 목적이다.
"""
import logging

from fastapi import FastAPI
from fastapi.dependencies.models import Dependant
from fastapi.routing import APIRoute

logger = logging.getLogger(__name__)

# 인증 없이 접근 가능한 경로. 여기 넣는 것은 '의도적 공개' 선언이다.
PUBLIC_PATHS: set[str] = {
    "/health",
    "/api/auth/signup",
    "/api/auth/login",
    # FastAPI 기본 문서 엔드포인트
    "/docs",
    "/redoc",
    "/openapi.json",
    "/docs/oauth2-redirect",
    # SPA 폴백 — 정적 파일 서빙이라 인증 대상이 아니다.
    "/{full_path:path}",
}


def _uses_dependency(dependant: Dependant, target) -> bool:
    """의존성 트리를 재귀적으로 훑어 target 호출자가 들어있는지 확인."""
    if dependant.call is target:
        return True
    return any(_uses_dependency(sub, target) for sub in dependant.dependencies)


def assert_all_routes_protected(app: FastAPI, auth_dependency) -> None:
    """공개 목록에 없으면서 인증 의존성도 없는 라우트가 있으면 예외를 던진다."""
    unprotected: list[str] = []

    for route in app.routes:
        if not isinstance(route, APIRoute):
            continue  # Mount(정적 파일) 등은 대상 외
        if route.path in PUBLIC_PATHS:
            continue
        if _uses_dependency(route.dependant, auth_dependency):
            continue
        methods = ",".join(sorted(route.methods or {"?"}))
        unprotected.append(f"{methods} {route.path}")

    if unprotected:
        raise RuntimeError(
            "인증이 걸리지 않은 엔드포인트가 있습니다. "
            "의도한 공개라면 route_guard.PUBLIC_PATHS에 추가하고, "
            "아니라면 인증 의존성을 붙이세요:\n  - "
            + "\n  - ".join(unprotected)
        )

    logger.info("라우트 인증 검사 통과 (공개 %d개)", len(PUBLIC_PATHS))
