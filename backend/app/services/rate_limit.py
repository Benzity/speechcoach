"""로그인 무차별 대입 방어 — 지수 백오프 기반.

설계 근거:
- 「개인정보의 안전성 확보조치 기준」 제5조는 "일정 횟수 이상 잘못 입력한 경우
  접근을 제한"할 의무를 부과한다(횟수는 미지정).
- ASVS 6.3.1: credential stuffing / brute force 방어 필요.
- ASVS 6.1.1: 다만 **악의적 계정 잠금(malicious account lockout)을 유발하지 말 것.**
  공격자가 남의 이메일로 반복 실패시켜 정상 이용자를 잠가버리는 DoS가 되기 때문.

그래서 '영구 잠금'이 아니라 '지연'을 쓴다. 실패가 쌓이면 다음 시도까지의
대기 시간이 지수적으로 늘어나되, 시간이 지나면 자연히 회복된다.

두 축으로 나눠 건다:
- 계정(이메일) 단위: 특정 계정을 노린 표적 공격을 늦춘다.
- IP 단위: 여러 계정을 훑는 분산 추측을 늦춘다. 프록시 뒤에서는 X-Forwarded-For를
  써야 하므로 TRUST_PROXY_HEADERS로 제어한다(아래 주의 참고).

저장소는 인메모리다. 현재 단일 프로세스(uvicorn + SQLite) 구성이라 충분하지만,
워커를 여러 개로 늘리면 Redis 등 공유 저장소로 옮겨야 한다.
"""
import os
import threading
import time

# 이 횟수까지는 지연 없이 허용한다. 오타를 배려하는 구간.
FREE_ATTEMPTS = 5
# 초과분 1회마다 대기 시간이 2배가 된다: 1s, 2s, 4s, 8s ...
BASE_DELAY_SEC = 1.0
# 대기 시간 상한. 계정이 영구히 잠기지 않도록 반드시 유한해야 한다.
MAX_DELAY_SEC = 900.0  # 15분
# 마지막 실패 후 이 시간이 지나면 기록을 잊는다(자연 회복).
FORGET_AFTER_SEC = 3600.0  # 1시간

# 프록시(ngrok, 로드밸런서) 뒤에서 실제 클라이언트 IP를 얻으려면 필요하다.
# ⚠️ 신뢰할 수 있는 프록시 뒤에서만 켤 것. 프록시가 클라이언트가 보낸
#    X-Forwarded-For를 덮어쓰지 않으면 공격자가 헤더를 위조해 IP 제한을
#    우회할 수 있다. 그 경우에도 계정 단위 제한은 그대로 동작하므로
#    표적 공격에 대한 방어선은 남는다.
TRUST_PROXY_HEADERS = os.getenv("TRUST_PROXY_HEADERS", "false").lower() == "true"


class RateLimited(Exception):
    """남은 대기 시간(초)을 담는다."""

    def __init__(self, retry_after: float) -> None:
        self.retry_after = max(1, int(round(retry_after)))
        super().__init__(f"너무 많은 시도가 있었습니다. {self.retry_after}초 후 다시 시도해주세요.")


class _Bucket:
    __slots__ = ("failures", "last_failure")

    def __init__(self) -> None:
        self.failures = 0
        self.last_failure = 0.0


_buckets: dict[str, _Bucket] = {}
_lock = threading.Lock()
_last_sweep = 0.0


def _required_delay(failures: int) -> float:
    """실패 횟수에 대한 다음 시도까지의 대기 시간.

    FREE_ATTEMPTS회까지는 지연 없이 시도할 수 있고, 그만큼 실패가 쌓이면
    다음 시도부터 백오프가 시작된다(1s, 2s, 4s ...).
    """
    if failures < FREE_ATTEMPTS:
        return 0.0
    exponent = failures - FREE_ATTEMPTS
    # 2**exponent가 커지면 float 오버플로가 나므로 상한을 먼저 건다.
    if exponent > 20:
        return MAX_DELAY_SEC
    return min(MAX_DELAY_SEC, BASE_DELAY_SEC * (2**exponent))


def _sweep_locked(now: float) -> None:
    """오래된 기록을 정리한다. 호출자가 _lock을 잡고 있어야 한다."""
    global _last_sweep
    if now - _last_sweep < 60.0:
        return
    _last_sweep = now
    stale = [k for k, b in _buckets.items() if now - b.last_failure > FORGET_AFTER_SEC]
    for k in stale:
        del _buckets[k]


def check(keys: list[str]) -> None:
    """주어진 키들이 모두 대기 조건을 통과하는지 확인. 아니면 RateLimited."""
    now = time.monotonic()
    with _lock:
        _sweep_locked(now)
        worst = 0.0
        for key in keys:
            bucket = _buckets.get(key)
            if bucket is None:
                continue
            if now - bucket.last_failure > FORGET_AFTER_SEC:
                # 충분히 시간이 지났으면 없던 일로 한다.
                del _buckets[key]
                continue
            elapsed = now - bucket.last_failure
            remaining = _required_delay(bucket.failures) - elapsed
            worst = max(worst, remaining)
        if worst > 0:
            raise RateLimited(worst)


def register_failure(keys: list[str]) -> None:
    """로그인 실패를 기록한다."""
    now = time.monotonic()
    with _lock:
        for key in keys:
            bucket = _buckets.get(key)
            if bucket is None or now - bucket.last_failure > FORGET_AFTER_SEC:
                bucket = _Bucket()
                _buckets[key] = bucket
            bucket.failures += 1
            bucket.last_failure = now


def reset(keys: list[str]) -> None:
    """로그인 성공 시 해당 키들의 기록을 지운다."""
    with _lock:
        for key in keys:
            _buckets.pop(key, None)


def client_ip(request) -> str:
    """요청의 클라이언트 IP. 프록시 신뢰 설정에 따라 달라진다."""
    if TRUST_PROXY_HEADERS:
        forwarded = request.headers.get("x-forwarded-for")
        if forwarded:
            # 첫 홉이 원 클라이언트
            return forwarded.split(",")[0].strip()
    client = request.client
    return client.host if client else "unknown"


def login_keys(request, email: str) -> list[str]:
    """로그인 시도에 적용할 제한 키 목록 (IP축 + 계정축)."""
    return [f"ip:{client_ip(request)}", f"acct:{email.lower()}"]


def _reset_all_for_tests() -> None:
    """테스트 격리용. 프로덕션 코드에서 호출하지 말 것."""
    global _last_sweep
    with _lock:
        _buckets.clear()
        _last_sweep = 0.0
