"""SQLAlchemy engine / SessionLocal / Base / get_db.

SQLite + WAL 모드 (Phase 0 결정 — read/write 동시성 안정성).
"""
from collections.abc import Iterator

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.core.config import DB_PATH

engine = create_engine(
    f"sqlite:///{DB_PATH}",
    connect_args={"check_same_thread": False},
)


@event.listens_for(engine, "connect")
def _enable_wal(dbapi_connection, _record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    # 삭제된 레코드가 남긴 내용을 0으로 덮어쓴다 (시행령 제16조 '복원 불가').
    # 기본값(OFF)에서는 DELETE가 페이지를 free list에 반환만 하므로 원본 바이트가
    # 파일에 그대로 남아 복구 도구로 읽힐 수 있다. 쓰기 비용이 다소 늘지만
    # 개인정보를 다루는 시스템에서는 켜는 것이 맞다.
    cursor.execute("PRAGMA secure_delete=ON")
    cursor.close()


SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
