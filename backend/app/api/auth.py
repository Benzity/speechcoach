"""회원가입 / 로그인 / 로그아웃 / 탈퇴 — JWT 기반."""
import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session as DbSession

from app.core.config import VIDEO_DIR
from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import Session as SessionModel
from app.db.models import User
from app.schemas.auth import LoginRequest, SignupRequest, TokenResponse, UserRead
from app.services import rate_limit
from app.services.age_check import AgeVerificationError, verify_min_age
from app.services.auth import create_access_token, hash_password, verify_password
from app.services.password_policy import PasswordPolicyError, validate_password
from app.services.secure_delete import secure_delete_tree, vacuum_database

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

# 동의 문구가 바뀌면 이 값을 올린다. 어떤 버전에 동의했는지 이력에 남는다.
# frontend/src/pages/PrivacyPage.tsx의 EFFECTIVE_DATE와 같은 값을 유지할 것.
CONSENT_VERSION = "2026-08-14"


@router.post(
    "/signup",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="회원가입 + 토큰 발급",
)
def signup(body: SignupRequest, db: DbSession = Depends(get_db)) -> TokenResponse:
    email = body.email.lower().strip()

    # 만 14세 미만 차단 (제22조의2). 생년월일은 검증에만 쓰고 저장하지 않는다.
    try:
        verify_min_age(body.birth_date)
    except AgeVerificationError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # 흔한 비밀번호 차단 (ASVS 6.2.4). 길이 검증은 스키마에서 이미 끝났다.
    try:
        validate_password(body.password)
    except PasswordPolicyError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e

    # 필수 동의를 받지 않으면 가입시키지 않는다 (제15조·제22조).
    if not body.consent_privacy:
        raise HTTPException(
            status_code=400, detail="개인정보 수집·이용에 동의해야 가입할 수 있습니다."
        )
    # 국외이전은 별도 동의 항목이다 (제28조의8). 이력서·답변이 Claude API로
    # 전송되므로 이 동의 없이는 서비스 제공이 불가능하다.
    if not body.consent_overseas:
        raise HTTPException(
            status_code=400,
            detail="개인정보 국외이전에 동의해야 가입할 수 있습니다. "
            "면접 질문·피드백 생성에 해외 AI 서비스를 이용합니다.",
        )

    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="이미 가입된 이메일입니다.")

    now = datetime.utcnow()
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(body.password),
        display_name=(body.display_name or "").strip() or None,
        token_version=0,
        consented_at=now,
        consent_version=CONSENT_VERSION,
        overseas_consented_at=now,
        age_verified_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info("회원가입 완료 user_id=%s consent=%s", user.id, CONSENT_VERSION)
    return TokenResponse(access_token=create_access_token(user.id, user.token_version))


@router.post("/login", response_model=TokenResponse, summary="로그인 + 토큰 발급")
def login(
    body: LoginRequest, request: Request, db: DbSession = Depends(get_db)
) -> TokenResponse:
    email = body.email.lower().strip()
    keys = rate_limit.login_keys(request, email)

    # 인증 시도 전에 대기 조건부터 확인한다 (안전성 확보조치 기준 제5조).
    try:
        rate_limit.check(keys)
    except rate_limit.RateLimited as e:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=str(e),
            headers={"Retry-After": str(e.retry_after)},
        ) from e

    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(body.password, user.password_hash):
        rate_limit.register_failure(keys)
        # 계정 존재 여부를 노출하지 않도록 메시지를 통일한다.
        raise HTTPException(
            status_code=401, detail="이메일 또는 비밀번호가 잘못되었습니다."
        )

    rate_limit.reset(keys)
    return TokenResponse(access_token=create_access_token(user.id, user.token_version))


@router.get("/me", response_model=UserRead, summary="현재 로그인 유저")
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="로그아웃 — 발급된 토큰을 서버에서 무효화",
)
def logout(
    db: DbSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    # 토큰 세대를 올리면 기존에 발급된 JWT가 전부 즉시 무효가 된다.
    # 클라이언트에서 localStorage를 지우는 것만으로는 탈취된 토큰을 막을 수 없다.
    current_user.token_version += 1
    db.commit()
    logger.info("로그아웃 user=%s", current_user.id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete(
    "/me",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="회원 탈퇴 — 계정·세션·영상 전부 삭제 (제37조·제21조)",
)
def delete_me(
    db: DbSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    user_id = current_user.id

    # 영상 파일은 DB cascade로 지워지지 않으므로 직접 지운다.
    # 단순 삭제가 아니라 덮어쓰기 후 삭제한다 (시행령 제16조 '복원 불가').
    session_ids = [
        row.id
        for row in db.query(SessionModel.id).filter(SessionModel.user_id == user_id).all()
    ]
    for sid in session_ids:
        video_dir = VIDEO_DIR / sid
        if video_dir.exists():
            secure_delete_tree(video_dir)

    # sessions → questions → analyses / feedback 은 cascade로 함께 삭제된다.
    db.delete(current_user)
    db.commit()

    # secure_delete PRAGMA로 내용은 덮어써졌지만, VACUUM까지 해야 빈 페이지가
    # 회수되어 DB 파일에서 완전히 사라진다.
    vacuum_database()

    logger.info("회원 탈퇴 완료 user=%s sessions=%d", user_id, len(session_ids))
    return Response(status_code=status.HTTP_204_NO_CONTENT)
