"""회원가입 / 로그인 / 내 정보 — JWT 기반."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session as DbSession

from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import User
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserRead
from app.services.auth import create_access_token, hash_password, verify_password

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입 + 토큰 발급",
)
def signup(body: SignupRequest, db: DbSession = Depends(get_db)) -> TokenResponse:
    email = body.email.lower().strip()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")

    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(body.password),
        display_name=(body.display_name or "").strip() or None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("회원가입 완료 user_id=%s", user.id)
    return TokenResponse(access_token=create_access_token(user.id))


@router.post("/login", response_model=TokenResponse, summary="로그인 + 토큰 발급")
def login(body: LoginRequest, db: DbSession = Depends(get_db)) -> TokenResponse:
    email = body.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="이메일 또는 비밀번호가 잘못되었습니다.")
    return TokenResponse(access_token=create_access_token(user.id))


@router.get("/me", response_model=UserRead, summary="현재 로그인 유저")
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
