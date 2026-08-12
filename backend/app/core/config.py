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
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "cuda")

JWT_SECRET = os.getenv("JWT_SECRET")
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET 환경변수가 설정되지 않았습니다. backend/.env를 확인하세요.")
JWT_ALGORITHM = "HS256"
JWT_ACCESS_TTL_DAYS = int(os.getenv("JWT_ACCESS_TTL_DAYS", "7"))

VIDEO_DIR.mkdir(parents=True, exist_ok=True)
DB_PATH.parent.mkdir(parents=True, exist_ok=True)
