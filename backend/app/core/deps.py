"""FastAPI 공용 의존성 — 현재 로그인 유저 추출."""
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session as DbSession

from app.db.database import get_db
from app.db.models import User
from app.services.auth import TokenError, decode_token


def get_current_user(
    authorization: str | None = Header(default=None),
    db: DbSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="인증 토큰이 필요합니다.",
        )
    token = authorization.split(" ", 1)[1].strip()

    try:
        payload = decode_token(token)
    except TokenError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰 sub 누락")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="존재하지 않는 사용자")
    return user
