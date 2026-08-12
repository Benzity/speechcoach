import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.me import router as me_router
from app.api.sessions import router as sessions_router
from app.core.logging import setup_logging
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


def _migrate_add_columns() -> None:
    """Alembic이 없어 create_all로 못 잡는 기존 테이블의 신규 컬럼을 수동 추가."""
    from sqlalchemy import inspect, text

    inspector = inspect(engine)
    cols = {c["name"] for c in inspector.get_columns("sessions")}
    if "language" not in cols:
        with engine.begin() as conn:
            conn.execute(
                text("ALTER TABLE sessions ADD COLUMN language VARCHAR NOT NULL DEFAULT 'ko'")
            )


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    _migrate_add_columns()
    _recover_stuck_analyses()
    yield


app = FastAPI(title="SpeechCoach AI", version="2.0.0", lifespan=lifespan)

# Netlify 등 외부에서 frontend가 절대 URL로 backend를 호출할 때 CORS 허용.
# CORS_ORIGINS="*" (기본) 또는 콤마 구분 도메인 목록.
_cors_raw = os.getenv("CORS_ORIGINS", "*").strip()
_allow_origins = (
    ["*"] if _cors_raw == "*" else [o.strip() for o in _cors_raw.split(",") if o.strip()]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
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
