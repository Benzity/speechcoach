"""테스트 공통 설정 — app 모듈을 import하기 전에 환경변수를 잡아준다."""
import base64
import os
import tempfile
from pathlib import Path

# config.py가 import 시점에 JWT_SECRET을 요구하므로 먼저 설정해야 한다.
# RFC 7518 §3.2에 따라 32바이트 이상이어야 한다 (config.py에서 검증).
os.environ.setdefault(
    "JWT_SECRET", "test-only-secret-do-not-use-in-production-0123456789"
)

# 영상 암호화 키 (테스트 전용, 32바이트 base64).
os.environ.setdefault(
    "VIDEO_ENCRYPTION_KEY",
    base64.b64encode(b"test-only-video-key-32bytes-xxxx").decode(),
)

_tmp = Path(tempfile.mkdtemp(prefix="speechcoach-test-"))
os.environ.setdefault("VIDEO_DIR", str(_tmp / "videos"))
os.environ.setdefault("DB_PATH", str(_tmp / "test.db"))
# 레이트리밋 테스트에서 X-Forwarded-For를 쓰기 위해 켠다.
os.environ.setdefault("TRUST_PROXY_HEADERS", "true")

import pytest  # noqa: E402


@pytest.fixture(autouse=True)
def _isolate_rate_limit():
    """테스트 간 레이트리밋 상태가 새지 않도록 초기화한다."""
    from app.services import rate_limit

    rate_limit._reset_all_for_tests()
    yield
    rate_limit._reset_all_for_tests()
