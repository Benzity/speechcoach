"""보유기간 자동 파기 — 제21조 대응 확인.

동의 화면·처리방침에 고지한 기간과 코드가 어긋나면 그 자체로 위반이 되므로,
기간 상수를 테스트로 고정해 무단 변경을 막는다.
"""
import uuid
from datetime import datetime, timedelta

import pytest

from app.core.config import VIDEO_DIR
from app.db.database import SessionLocal
from app.db.models import Question
from app.db.models import Session as SessionModel
from app.db.models import User
from app.services import retention


def test_retention_periods_match_published_policy():
    """처리방침·동의 화면에 고지한 값과 일치해야 한다.

    바꾸려면 PrivacyPage.tsx와 SignupPage.tsx의 문구도 함께 고쳐야 하고,
    기간을 '늘리는' 변경은 재동의가 필요하다.
    """
    assert retention.VIDEO_RETENTION_DAYS == 30
    assert retention.RESULT_RETENTION_DAYS == 180


@pytest.fixture
def user_and_session():
    """만료 대상으로 쓸 사용자/세션을 만들고, 끝나면 정리한다."""
    db = SessionLocal()
    user_id = str(uuid.uuid4())
    session_id = str(uuid.uuid4())
    try:
        db.add(
            User(
                id=user_id,
                email=f"ret-{user_id[:8]}@example.com",
                password_hash="x",
                token_version=0,
            )
        )
        db.add(
            SessionModel(
                id=session_id,
                user_id=user_id,
                job_title="백엔드 개발자",
                resume_text="테스트 이력서",
                question_count=1,
                status="completed",
            )
        )
        db.add(
            Question(
                id=str(uuid.uuid4()),
                session_id=session_id,
                q_index=0,
                text="자기소개를 해주세요.",
            )
        )
        db.commit()
    finally:
        db.close()

    yield user_id, session_id

    db = SessionLocal()
    try:
        row = db.get(SessionModel, session_id)
        if row:
            db.delete(row)
        u = db.get(User, user_id)
        if u:
            db.delete(u)
        db.commit()
    finally:
        db.close()


def _age_session(session_id: str, days: int) -> None:
    db = SessionLocal()
    try:
        row = db.get(SessionModel, session_id)
        row.created_at = datetime.utcnow() - timedelta(days=days)
        db.commit()
    finally:
        db.close()


def test_fresh_video_is_not_purged(user_and_session):
    _, session_id = user_and_session
    video_dir = VIDEO_DIR / session_id
    video_dir.mkdir(parents=True, exist_ok=True)
    (video_dir / "0.webm").write_bytes(b"fake-video")

    retention.purge_expired_videos()
    assert (video_dir / "0.webm").exists(), "보유기간 내 영상이 삭제되면 안 됨"


def test_expired_video_is_purged_but_results_remain(user_and_session):
    """영상만 30일에 지우고 분석 결과는 남겨야 히스토리가 유지된다."""
    _, session_id = user_and_session
    video_dir = VIDEO_DIR / session_id
    video_dir.mkdir(parents=True, exist_ok=True)
    (video_dir / "0.webm").write_bytes(b"fake-video")

    _age_session(session_id, retention.VIDEO_RETENTION_DAYS + 1)
    retention.purge_expired_videos()

    assert not video_dir.exists(), "보유기간 경과 영상은 삭제되어야 함"

    db = SessionLocal()
    try:
        assert db.get(SessionModel, session_id) is not None, "분석 결과는 남아야 함"
    finally:
        db.close()


def test_expired_session_is_fully_purged(user_and_session):
    _, session_id = user_and_session
    _age_session(session_id, retention.RESULT_RETENTION_DAYS + 1)

    retention.purge_expired_sessions()

    db = SessionLocal()
    try:
        assert db.get(SessionModel, session_id) is None
        # cascade로 질문도 함께 지워져야 한다
        remaining = (
            db.query(Question).filter(Question.session_id == session_id).count()
        )
        assert remaining == 0
    finally:
        db.close()


def test_sweep_is_safe_to_run_repeatedly():
    """스케줄러가 반복 호출해도 예외가 나면 안 된다."""
    first = retention.run_retention_sweep()
    second = retention.run_retention_sweep()
    assert set(first) == {"videos_purged", "sessions_purged"}
    assert set(second) == {"videos_purged", "sessions_purged"}
