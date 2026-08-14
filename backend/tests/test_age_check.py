"""만 14세 미만 확인 — 개인정보 보호법 제22조의2."""
from datetime import date

import pytest

from app.services.age_check import (
    MIN_AGE,
    AgeVerificationError,
    calculate_age,
    verify_min_age,
)

TODAY = date(2026, 8, 13)


def test_minimum_age_is_fourteen():
    """제22조의2의 기준 연령."""
    assert MIN_AGE == 14


def test_age_counts_birthday_not_yet_passed():
    """생일 전이면 만 나이가 1살 적다."""
    assert calculate_age(date(2000, 8, 14), TODAY) == 25  # 하루 전
    assert calculate_age(date(2000, 8, 13), TODAY) == 26  # 당일
    assert calculate_age(date(2000, 8, 12), TODAY) == 26  # 지남


def test_rejects_under_fourteen():
    # 만 13세 (생일 하루 전)
    with pytest.raises(AgeVerificationError) as exc:
        verify_min_age(date(2012, 8, 14), TODAY)
    assert "14세" in str(exc.value)


def test_accepts_exactly_fourteen_on_birthday():
    """만 14세가 되는 당일은 가입 가능해야 한다."""
    assert verify_min_age(date(2012, 8, 13), TODAY) == 14


def test_rejects_future_date():
    with pytest.raises(AgeVerificationError):
        verify_min_age(date(2027, 1, 1), TODAY)


def test_rejects_implausible_date():
    with pytest.raises(AgeVerificationError):
        verify_min_age(date(1800, 1, 1), TODAY)


def test_accepts_typical_job_seeker():
    assert verify_min_age(date(1999, 3, 20), TODAY) == 27
