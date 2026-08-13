"""인증 관련 요청/응답 스키마."""
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.services.password_policy import MAX_LENGTH, MIN_LENGTH


class SignupRequest(BaseModel):
    email: EmailStr
    # 길이 하한/상한만 스키마에서 강제하고, 복잡도 규칙은 두지 않는다
    # (ASVS 6.2.5 — 문자 종류 강제 금지). 흔한 비밀번호 차단은
    # password_policy.validate_password가 담당한다.
    password: str = Field(min_length=MIN_LENGTH, max_length=MAX_LENGTH)
    display_name: str | None = Field(default=None, max_length=64)
    # 만 14세 미만 확인용 (제22조의2). 검증에만 쓰고 저장하지 않는다.
    birth_date: date = Field(description="생년월일 (연령 확인용, 저장하지 않음)")
    # 필수 동의 2종. 기본값을 False로 두어 클라이언트가 누락하면 가입이 막힌다.
    consent_privacy: bool = Field(
        default=False, description="개인정보 수집·이용 동의 (필수)"
    )
    consent_overseas: bool = Field(
        default=False, description="개인정보 국외이전 동의 (필수)"
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    display_name: str | None
    created_at: datetime
