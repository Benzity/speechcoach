"""로그인 레이트리밋 — ASVS 6.3.1 방어 + 6.1.1 악의적 잠금 방지."""
import pytest

from app.services import rate_limit


def test_free_attempts_pass_without_delay():
    keys = ["acct:a@example.com"]
    for _ in range(rate_limit.FREE_ATTEMPTS):
        rate_limit.check(keys)  # 예외 없어야 함
        rate_limit.register_failure(keys)
    # 아직 무료 구간을 막 소진한 시점 — 다음 시도부터 지연이 붙는다
    with pytest.raises(rate_limit.RateLimited):
        rate_limit.check(keys)


def test_delay_grows_exponentially():
    d1 = rate_limit._required_delay(rate_limit.FREE_ATTEMPTS + 1)
    d2 = rate_limit._required_delay(rate_limit.FREE_ATTEMPTS + 2)
    d3 = rate_limit._required_delay(rate_limit.FREE_ATTEMPTS + 3)
    assert 0 < d1 < d2 < d3


def test_delay_is_capped_and_never_permanent():
    """ASVS 6.1.1 — 영구 잠금이 되면 안 된다.

    공격자가 남의 계정으로 반복 실패시켜 정상 이용자를 잠가버리는
    DoS를 막기 위해 대기 시간에 반드시 상한이 있어야 한다.
    """
    huge = rate_limit._required_delay(10_000)
    assert huge == rate_limit.MAX_DELAY_SEC
    assert rate_limit.MAX_DELAY_SEC < float("inf")


def test_successful_login_resets_counter():
    keys = ["acct:b@example.com"]
    for _ in range(rate_limit.FREE_ATTEMPTS + 2):
        rate_limit.register_failure(keys)
    with pytest.raises(rate_limit.RateLimited):
        rate_limit.check(keys)

    rate_limit.reset(keys)
    rate_limit.check(keys)  # 초기화되어 통과해야 함


def test_account_and_ip_are_independent_axes():
    """한 계정이 막혀도 다른 계정은 영향받지 않아야 한다."""
    rate_limit.register_failure(["acct:victim@example.com"])
    for _ in range(rate_limit.FREE_ATTEMPTS + 3):
        rate_limit.register_failure(["acct:victim@example.com"])

    with pytest.raises(rate_limit.RateLimited):
        rate_limit.check(["acct:victim@example.com"])
    # 다른 계정은 자유로워야 한다
    rate_limit.check(["acct:other@example.com"])


def test_retry_after_is_positive_integer():
    keys = ["acct:c@example.com"]
    for _ in range(rate_limit.FREE_ATTEMPTS + 4):
        rate_limit.register_failure(keys)
    with pytest.raises(rate_limit.RateLimited) as exc:
        rate_limit.check(keys)
    assert isinstance(exc.value.retry_after, int)
    assert exc.value.retry_after >= 1
