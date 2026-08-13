"""현재 로그인 유저 관련 — 히스토리 목록."""
import json
import logging

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session as DbSession

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import Feedback as FeedbackModel
from app.db.models import Session as SessionModel
from app.db.models import User as UserModel
from app.schemas.sessions import SessionListItem

logger = logging.getLogger(__name__)
# router-level 인증 (default-deny). app/core/route_guard.py 참고.
router = APIRouter(
    prefix="/api/me", tags=["me"], dependencies=[Depends(get_current_user)]
)


@router.get(
    "/sessions",
    response_model=list[SessionListItem],
    summary="내 면접 히스토리 (최신순)",
)
def list_my_sessions(
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> list[SessionListItem]:
    rows = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.created_at.desc())
        .all()
    )

    items: list[SessionListItem] = []
    for s in rows:
        score: float | None = None
        fb = db.get(FeedbackModel, s.id)
        if fb is not None:
            try:
                data = json.loads(fb.llm_response_json)
                score = data.get("scores", {}).get("overall")
            except (json.JSONDecodeError, AttributeError):
                pass

        items.append(
            SessionListItem(
                id=s.id,
                job_title=s.job_title,
                question_count=s.question_count,
                status=s.status,
                created_at=s.created_at,
                overall_score=score,
            )
        )
    return items
