import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.sessions import router as sessions_router
from app.core.logging import setup_logging
from app.db import models  # noqa: F401 — 테이블 등록을 위한 import
from app.db.database import Base, engine

setup_logging()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
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

app.include_router(sessions_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
