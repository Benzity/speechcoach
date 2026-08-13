"""FastAPI 공용 의존성 — 현재 로그인 유저 추출."""
from fastapi import Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session as DbSession

from app.db.database import get_db
from app.db.models import User
from app.services.auth import TokenError, decode_token


def get_current_user(
    request: Request,
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

    # 토큰 세대 검증 — 로그아웃·탈퇴·비밀번호 변경 시 발급분을 무효화한다.
    # tv가 없는 구버전 토큰은 0으로 간주해, 세대가 올라간 계정에서는 거부된다.
    if int(payload.get("tv", 0)) != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="만료된 토큰입니다. 다시 로그인해주세요.",
        )

    # 접속기록 미들웨어가 계정을 특정할 수 있도록 남긴다 (고시 제8조).
    request.state.access_user_id = user.id
    return user
