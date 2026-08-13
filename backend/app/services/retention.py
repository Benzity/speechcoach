"""보유기간 경과 데이터 자동 파기 (제21조).

「개인정보 보호법」 제21조는 보유기간 경과·목적 달성 시 **지체 없는 파기**를
요구한다. 법이 구체적 기간을 정하지는 않으므로 아래 값은 서비스 정책이며,
개인정보 처리방침·동의 화면에 고지한 값과 반드시 일치해야 한다.

데이터 종류별로 위험도와 재사용 가치가 다르므로 기간을 나눈다:
- 원본 영상: 얼굴·음성이 담긴 가장 민감한 데이터. 다시 볼 가치는 짧은 기간에
  집중되고 용량도 크므로 30일.
- 분석 결과(전사문·점수·지표): 회차 간 비교(히스토리)에 필요. 공채 한 사이클을
  고려해 6개월.
- 계정: 탈퇴 시까지. 탈퇴하면 전부 즉시 삭제된다(api/auth.py delete_me).

⚠️ 이 기간을 늘리려면 동의 사항 변경이라 재동의가 필요하다. 줄이는 것은 자유.
"""
import logging
from datetime import datetime, timedelta

from app.core.config import VIDEO_DIR
from app.db.database import SessionLocal
from app.db.models import Analysis, Question
from app.db.models import Session as SessionModel
from app.services.secure_delete import secure_delete_tree, vacuum_database

logger = logging.getLogger(__name__)

VIDEO_RETENTION_DAYS = 30
RESULT_RETENTION_DAYS = 180  # 약 6개월


def purge_expired_videos(now: datetime | None = None) -> int:
    """보유기간이 지난 원본 영상 파일을 삭제한다. 분석 결과는 남긴다."""
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=VIDEO_RETENTION_DAYS)
    db = SessionLocal()
    removed = 0
    try:
        expired = (
            db.query(SessionModel)
            .filter(SessionModel.created_at < cutoff)
            .all()
        )
        for session_row in expired:
            video_dir = VIDEO_DIR / session_row.id
            if video_dir.exists():
                # 단순 삭제가 아니라 덮어쓰기 후 삭제 (시행령 제16조).
                secure_delete_tree(video_dir)
                removed += 1
            # 파일이 사라졌으므로 DB의 경로 참조도 끊는다.
            q_ids = [
                q.id
                for q in db.query(Question.id)
                .filter(Question.session_id == session_row.id)
                .all()
            ]
            if q_ids:
                (
                    db.query(Analysis)
                    .filter(Analysis.question_id.in_(q_ids))
                    .update({Analysis.video_path: None}, synchronize_session=False)
                )
        db.commit()
    except Exception:
        logger.exception("영상 파기 실패")
        db.rollback()
    finally:
        db.close()

    if removed:
        logger.info("보유기간 경과 영상 %d개 세션 파기 (기준 %d일)", removed, VIDEO_RETENTION_DAYS)
    return removed


def purge_expired_sessions(now: datetime | None = None) -> int:
    """보유기간이 지난 세션 전체(분석 결과 포함)를 삭제한다."""
    now = now or datetime.utcnow()
    cutoff = now - timedelta(days=RESULT_RETENTION_DAYS)
    db = SessionLocal()
    removed = 0
    try:
        expired = (
            db.query(SessionModel)
            .filter(SessionModel.created_at < cutoff)
            .all()
        )
        for session_row in expired:
            video_dir = VIDEO_DIR / session_row.id
            if video_dir.exists():
                secure_delete_tree(video_dir)
            # questions → analyses / feedback 은 cascade로 함께 지워진다.
            db.delete(session_row)
            removed += 1
        db.commit()
    except Exception:
        logger.exception("세션 파기 실패")
        db.rollback()
    finally:
        db.close()

    if removed:
        # secure_delete PRAGMA가 삭제 내용을 0으로 덮어쓰지만, VACUUM까지 해야
        # 빈 페이지가 회수되어 파일에서 완전히 사라진다 (시행령 제16조).
        vacuum_database()
        logger.info("보유기간 경과 세션 %d건 파기 (기준 %d일)", removed, RESULT_RETENTION_DAYS)
    return removed


def run_retention_sweep() -> dict[str, int]:
    """두 정책을 한 번에 적용한다. 스케줄러가 호출하는 진입점."""
    # 순서 주의: 세션 전체 삭제를 먼저 하면 영상 파기 대상이 줄어 불필요한
    # 순회를 피할 수 있으나, 로그 가독성을 위해 영상 → 세션 순으로 둔다.
    videos = purge_expired_videos()
    sessions = purge_expired_sessions()
    return {"videos_purged": videos, "sessions_purged": sessions}
