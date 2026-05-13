from contextlib import asynccontextmanager

from fastapi import FastAPI

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
app.include_router(sessions_router)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
