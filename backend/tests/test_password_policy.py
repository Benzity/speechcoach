"""비밀번호 정책 — OWASP ASVS 5.0 V6.2 / NIST SP 800-63B-4 준수 확인."""
import pytest

from app.services.password_policy import (
    MAX_LENGTH,
    MIN_LENGTH,
    PasswordPolicyError,
    validate_password,
)


def test_minimum_length_is_at_least_asvs_l1():
    """ASVS 6.2.1(L1) — 최소 8자."""
    assert MIN_LENGTH >= 8


def test_allows_long_passphrases():
    """ASVS 6.2.9 — 긴 패스프레이즈를 막으면 안 된다.

    bcrypt가 72바이트에서 자르므로 상한을 72로 두었다. 그보다 낮으면
    패스프레이즈 사용자를 불필요하게 제약하는 것이다.
    """
    assert MAX_LENGTH >= 64


def test_rejects_too_short():
    with pytest.raises(PasswordPolicyError):
        validate_password("a" * (MIN_LENGTH - 1))


def test_accepts_at_boundary():
    # 경계값은 통과해야 한다 (흔한 비밀번호가 아니어야 하므로 임의 문자열)
    validate_password("wq" + "z" * (MIN_LENGTH - 2))


@pytest.mark.parametrize(
    "password",
    [
        "alllowercaseonly",  # 소문자만
        "ALLUPPERCASEONLY",  # 대문자만
        "12345678901234567",  # 숫자만 (흔한 조합 아님)
        "correct horse battery",  # 공백 포함 패스프레이즈
    ],
)
def test_no_composition_rules(password):
    """ASVS 6.2.5 — 문자 종류 혼합을 강제하면 안 된다.

    이전 정책은 '복잡도 권장'이었으나 현행 표준은 이를 명시적으로 금지한다.
    예측 가능한 치환 패턴만 만들고 엔트로피는 오르지 않기 때문이다.
    """
    validate_password(password)


@pytest.mark.parametrize(
    "password",
    ["password", "12345678", "qwerty123", "iloveyou", "PASSWORD1", "Password123"],
)
def test_blocks_common_passwords(password):
    """ASVS 6.2.4(L1) — 흔한 비밀번호 차단. 대소문자 무시."""
    with pytest.raises(PasswordPolicyError):
        validate_password(password)


def test_common_password_check_is_case_insensitive():
    with pytest.raises(PasswordPolicyError):
        validate_password("PaSsWoRd123")
