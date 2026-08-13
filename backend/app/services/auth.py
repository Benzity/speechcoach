"""비밀번호 해싱 + JWT 생성/검증."""
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app.core.config import JWT_ACCESS_TTL_DAYS, JWT_ALGORITHM, JWT_SECRET


class TokenError(Exception):
    pass


def _bcrypt_bytes(plain: str) -> bytes:
    # bcrypt는 72바이트 초과 입력에 ValueError를 던진다(한글은 24자만 넘어도 초과).
    # 해싱/검증 양쪽에서 동일하게 72바이트로 잘라 일관성을 보장한다.
    return plain.encode("utf-8")[:72]


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(_bcrypt_bytes(plain), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(_bcrypt_bytes(plain), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_access_token(user_id: str, token_version: int = 0) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        # 토큰 세대. 서버의 users.token_version과 다르면 폐기된 토큰으로 본다.
        "tv": token_version,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=JWT_ACCESS_TTL_DAYS)).timestamp()),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError as e:
        raise TokenError("토큰이 만료되었습니다.") from e
    except jwt.InvalidTokenError as e:
        raise TokenError("유효하지 않은 토큰입니다.") from e
