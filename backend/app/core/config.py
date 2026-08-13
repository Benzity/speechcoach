"""환경변수 로드 + 기본 설정. .env 파일을 backend/ 루트에서 로드한다."""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # backend/
load_dotenv(BASE_DIR / ".env")

HOST = os.getenv("HOST", "127.0.0.1")
PORT = int(os.getenv("PORT", "8002"))

VIDEO_DIR = Path(os.getenv("VIDEO_DIR") or (BASE_DIR / "data" / "videos"))
DB_PATH = Path(os.getenv("DB_PATH") or (BASE_DIR / "data" / "app.db"))

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cuda")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET 환경변수가 설정되지 않았습니다. backend/.env를 확인하세요.")

# RFC 7518 §3.2 — HS256의 키는 해시 출력 길이(32바이트) 이상이어야 한다.
# 짧은 키는 오프라인 무차별 대입으로 복원될 수 있고, 그러면 임의의 사용자로
# 위장하는 토큰을 만들 수 있다.
JWT_SECRET_MIN_BYTES = 32
if len(JWT_SECRET.encode("utf-8")) < JWT_SECRET_MIN_BYTES:
    raise RuntimeError(
        f"JWT_SECRET이 너무 짧습니다({len(JWT_SECRET.encode('utf-8'))}바이트). "
        f"{JWT_SECRET_MIN_BYTES}바이트 이상이어야 합니다. "
        "생성 예: python -c \"import secrets; print(secrets.token_urlsafe(48))\""
    )

# 답변 영상 저장 암호화 키 (안전성 확보조치 기준 제7조).
# JWT_SECRET과 별개의 키를 쓴다 — 한 키가 노출됐을 때 피해 범위를 가두기 위함이며,
# 용도별 키 분리는 암호 운용의 기본 원칙이다.
VIDEO_ENCRYPTION_KEY = os.getenv("VIDEO_ENCRYPTION_KEY", "").strip()
if not VIDEO_ENCRYPTION_KEY:
    raise RuntimeError(
        "VIDEO_ENCRYPTION_KEY 환경변수가 설정되지 않았습니다.\n"
        "답변 영상에는 얼굴·음성이 담겨 암호화 저장이 필요합니다"
        "(개인정보의 안전성 확보조치 기준 제7조).\n"
        '생성: python -c "import base64,os; print(base64.b64encode(os.urandom(32)).decode())"'
    )

JWT_ALGORITHM = "HS256"
JWT_ACCESS_TTL_DAYS = int(os.getenv("JWT_ACCESS_TTL_DAYS", "7"))

VIDEO_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
