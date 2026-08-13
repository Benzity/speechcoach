import logging
import os
import threading
import time
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.me import router as me_router
from app.api.sessions import router as sessions_router
from app.core.access_log import AccessLogMiddleware
from app.core.deps import get_current_user
from app.core.logging import setup_logging
from app.core.route_guard import assert_all_routes_protected
from app.db import models  # noqa: F401 — 테이블 등록을 위한 import
from app.db.database import Base, engine

setup_logging()


def _recover_stuck_analyses() -> None:
    """재시작 시 인메모리 큐가 비므로, 중단된 분석(queued/processing)을 다시 큐에 넣는다."""
    import logging

    from app.db.database import SessionLocal
    from app.db.models import Analysis
    from app.workers.queue import submit_analysis

    logger = logging.getLogger(__name__)
    db = SessionLocal()
    try:
        stuck = (
            db.query(Analysis)
            .filter(Analysis.status.in_(("queued", "processing")))
            .filter(Analysis.video_path.isnot(None))
            .all()
        )
        for a in stuck:
            a.status = "queued"
        db.commit()
        ids = [a.question_id for a in stuck]
    except Exception:
        logger.exception("중단된 분석 복구 실패")
        ids = []
    finally:
        db.close()
    for qid in ids:
        submit_analysis(qid)
    if ids:
        logger.info("중단된 분석 %d건 재큐잉", len(ids))


def _migrate_sqlite_columns() -> None:
    """create_all은 기존 테이블에 컬럼을 추가하지 않는다.

    Alembic을 도입하기 전까지, 새로 추가된 컬럼을 SQLite에 직접 반영한다.
    이미 있으면 건너뛰므로 반복 실행해도 안전하다.
    """
    import logging

    from sqlalchemy import text

    logger = logging.getLogger(__name__)
    # (테이블, 컬럼, DDL 타입)
    additions = [
        ("users", "token_version", "INTEGER NOT NULL DEFAULT 0"),
        ("users", "consented_at", "DATETIME"),
        ("users", "consent_version", "VARCHAR"),
        ("users", "overseas_consented_at", "DATETIME"),
        ("users", "age_verified_at", "DATETIME"),
    ]
    with engine.begin() as conn:
        for table, column, ddl in additions:
            existing = {
                row[1] for row in conn.execute(text(f"PRAGMA table_info({table})"))
            }
            if not existing:
                continue  # 테이블 자체가 아직 없으면 create_all이 만든다
            if column in existing:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
            logger.info("스키마 마이그레이션: %s.%s 추가", table, column)


def _start_retention_scheduler() -> threading.Thread:
    """보유기간 경과 데이터를 주기적으로 파기한다 (제21조).

    외부 스케줄러 의존성을 늘리지 않으려고 데몬 스레드로 돌린다.
    프로세스가 여러 개로 늘면 중복 실행되므로, 그 시점에는 단일 워커 전용
    크론이나 전용 잡으로 옮겨야 한다.
    """
    import logging

    from app.services.retention import run_retention_sweep

    logger = logging.getLogger(__name__)
    interval = 6 * 60 * 60  # 6시간마다

    def _loop() -> None:
        while True:
            try:
                result = run_retention_sweep()
                if any(result.values()):
                    logger.info("보유기간 파기 결과: %s", result)
            except Exception:
                logger.exception("보유기간 파기 중 오류")
            time.sleep(interval)

    thread = threading.Thread(target=_loop, name="retention", daemon=True)
    thread.start()
    return thread


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate_sqlite_columns()
    # 인증이 빠진 엔드포인트가 있으면 여기서 앱이 뜨지 않는다 (default-deny).
    assert_all_routes_protected(_app, get_current_user)
    _recover_stuck_analyses()
    _start_retention_scheduler()
    yield


app = FastAPI(title="SpeechCoach AI", version="2.1.0", lifespan=lifespan)

# Netlify 등 외부에서 frontend가 절대 URL로 backend를 호출할 때 CORS 허용.
# CORS_ORIGINS="*" (기본) 또는 콤마 구분 도메인 목록.
_cors_raw = os.getenv("CORS_ORIGINS", "*").strip()
_allow_origins = (
    ["*"] if _cors_raw == "*" else [o.strip() for o in _cors_raw.split(",") if o.strip()]
)
if _allow_origins == ["*"]:
    # 인증을 쿠키가 아니라 Authorization 헤더(Bearer)로 하고 allow_credentials가
    # False라, 와일드카드라도 브라우저가 자격증명을 실어 보내지 않는다.
    # 그래도 운영 환경에서는 도메인을 명시하는 편이 안전하다.
    logging.getLogger(__name__).warning(
        "CORS_ORIGINS가 '*'입니다. 운영 환경에서는 프론트엔드 도메인을 "
        "명시적으로 지정하세요 (예: CORS_ORIGINS=https://app.example.com)."
    )
# 개인정보처리시스템 접속기록 (안전성 확보조치 기준 제8조).
# CORS보다 먼저 등록해야 실제 응답 상태코드가 기록된다.
app.add_middleware(AccessLogMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    # 쿠키/자격증명을 쓰지 않으므로 False 유지. True로 바꾸려면 allow_origins에
    # 와일드카드를 쓸 수 없다(브라우저가 거부).
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(me_router)
app.include_router(sessions_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# ===== Frontend 정적 서빙 (ROADMAP 7.1 옵션 A) =====
# 라우터(/api/*, /health) 등록 뒤에 와야 우선순위가 맞음.
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    if (FRONTEND_DIST / "assets").exists():
        app.mount(
            "/assets",
            StaticFiles(directory=FRONTEND_DIST / "assets"),
            name="assets",
        )

    @app.get("/{full_path:path}", include_in_schema=False)
    def spa_fallback(full_path: str):
        # /api/*가 위 라우터들에서 매칭되지 않은 경우만 여기 도달 — 그 경우 404
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404)
        candidate = FRONTEND_DIST / full_path
        if full_path and candidate.is_file():
            return FileResponse(candidate)
        return FileResponse(FRONTEND_DIST / "index.html")
