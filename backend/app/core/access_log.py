"""개인정보처리시스템 접속기록 — 「개인정보의 안전성 확보조치 기준」 제8조.

고시 요구사항:
- 개인정보취급자의 개인정보처리시스템 접속기록을 **1년 이상** 보관·관리
- 5만명 이상의 정보주체 또는 고유식별정보·민감정보를 처리하는 경우 **2년 이상**
- 접속기록이 위·변조·도난·분실되지 않도록 안전하게 보관
- 오·남용 대응을 위해 **월 1회 이상 점검**

범위에 대한 판단:
고시상 '개인정보취급자'는 처리자의 지휘·감독을 받아 개인정보를 처리하는 자(직원·
관리자)를 뜻하고 정보주체 본인은 해당하지 않는다. 다만 현재 시스템에는 직원/이용자를
구분하는 역할 개념이 없으므로, **개인정보에 접근하는 모든 인증된 요청을 기록**한다.
요구 범위의 상위집합이므로 의무를 충족하며, 역할 구분이 생기면 취급자만 남기도록
좁힐 수 있다.

보관기간 판단 — 2년을 택한 이유:
고시 제8조 제1항은 1년 이상을 원칙으로 하되, ① 5만명 이상 ② **고유식별정보 또는
민감정보를 처리하는 시스템** ③ 기간통신사업자는 2년 이상을 요구한다.

우리가 저장하는 답변 영상에는 얼굴과 음성이 담긴다. 이를 '생체인식정보'로 보아
민감정보에 해당한다고 판단할 여지가 있고(시행령 제18조), 반대로 본 서비스의 처리
목적이 '특정 개인의 식별'이 아니라 '발표 습관 코칭'이므로 해당하지 않는다고 볼
여지도 있다. **이 판단은 다투어질 수 있는 영역이다.**

따라서 유리한 해석에 기대지 않고 **2년으로 상향**한다. 접속기록은 텍스트라
용량 부담이 거의 없어, 판단 리스크를 없애는 대가로는 저렴하다.

접속기록 대상 확대 (고시 제2025-9호, 2026.10.31 시행):
보관 대상이 '개인정보취급자'에서 '개인정보처리시스템에 접속한 자(정보주체 제외)'로
넓어진다. 아래 구현은 이미 모든 인증 접근을 기록하므로 선제적으로 충족한다.

접속기록은 그 자체가 개인정보(계정·IP)이지만, 법령상 보존 의무가 있는 정보이므로
제21조의 파기 대상에서 제외된다.
"""
import logging
import logging.handlers
from pathlib import Path

from starlette.middleware.base import BaseHTTPMiddleware

LOG_DIR = Path(__file__).resolve().parent.parent.parent / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

ACCESS_LOG_PATH = LOG_DIR / "access.log"
# 고시 제8조 제1항의 상한 기준(2년)에 여유를 더한 값. 위 주석 참고.
ACCESS_LOG_RETENTION_DAYS = 740

# 접속기록 대상 경로. 개인정보를 다루지 않는 요청까지 남기면 점검이 어려워진다.
_TRACKED_PREFIXES = ("/api/",)
# 개인정보 접근이 아니어서 제외하는 경로
_EXCLUDED_PATHS = frozenset({"/api/auth/signup", "/api/auth/login"})

_access_logger: logging.Logger | None = None


def get_access_logger() -> logging.Logger:
    """접속기록 전용 로거. 애플리케이션 로그와 파일·보관주기를 분리한다."""
    global _access_logger
    if _access_logger is not None:
        return _access_logger

    logger = logging.getLogger("access")
    logger.setLevel(logging.INFO)
    # 루트 로거로 전파되면 app.log(7일 보관)에도 섞여 보관주기가 무의미해진다.
    logger.propagate = False

    handler = logging.handlers.TimedRotatingFileHandler(
        ACCESS_LOG_PATH,
        when="midnight",
        backupCount=ACCESS_LOG_RETENTION_DAYS,
        encoding="utf-8",
    )
    handler.setFormatter(
        # 탭 구분 — 점검 스크립트가 파싱하기 쉽고 값에 콤마가 들어가도 안전하다.
        logging.Formatter("%(asctime)s\t%(message)s")
    )
    logger.addHandler(handler)
    _access_logger = logger
    return logger


def _client_ip(request) -> str:
    """접속지 정보. rate_limit과 동일한 프록시 신뢰 설정을 따른다."""
    from app.services.rate_limit import client_ip

    return client_ip(request)


class AccessLogMiddleware(BaseHTTPMiddleware):
    """개인정보처리시스템 접속기록을 남긴다 (고시 제8조).

    기록 항목: 접속일시 · 계정 · 접속지 IP · 수행업무(메서드+경로) · 처리 결과
    """

    async def dispatch(self, request, call_next):
        response = await call_next(request)

        path = request.url.path
        if not path.startswith(_TRACKED_PREFIXES) or path in _EXCLUDED_PATHS:
            return response

        # get_current_user가 request.state에 심어둔 계정 식별자를 쓴다.
        # 인증 실패 요청은 계정을 특정할 수 없으므로 '-'로 남긴다.
        user_id = getattr(request.state, "access_user_id", None) or "-"

        get_access_logger().info(
            "%s\t%s\t%s %s\t%s",
            user_id,
            _client_ip(request),
            request.method,
            path,
            response.status_code,
        )
        return response
