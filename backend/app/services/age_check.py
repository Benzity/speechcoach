"""만 14세 미만 아동 확인 — 개인정보 보호법 제22조의2.

제22조의2는 만 14세 미만 아동의 개인정보를 처리하려면 **법정대리인의 동의**를
받고 그 동의 여부를 **확인**하도록 요구한다.

설계 판단 — 왜 '차단'인가:
법정대리인 동의 절차(본인확인·동의 수집·확인)를 구현하는 것보다, 만 14세 미만의
가입 자체를 받지 않는 편이 안전하고 단순하다. 취업 준비 서비스라 만 14세 미만
이용자가 실질적으로 없고, 아동의 개인정보를 아예 수집하지 않으면 제22조의2의
적용 대상에서 벗어난다. 아동 데이터를 다루지 않는 것이 최선의 아동 보호다.

설계 판단 — 왜 생년월일을 저장하지 않는가:
연령 확인은 가입 시점에 1회만 필요하므로, 생년월일을 받아 **검증에만 쓰고
저장하지 않는다.** 저장하는 것은 '확인을 마친 시각'뿐이다. 최소수집 원칙
(제16조)에 부합하며, 유출 시 노출되는 정보도 줄어든다.
"""
from datetime import date

MIN_AGE = 14


class AgeVerificationError(ValueError):
    """사용자에게 그대로 노출 가능한 한국어 메시지."""


def calculate_age(birth_date: date, today: date | None = None) -> int:
    """만 나이를 계산한다. 생일이 지나지 않았으면 1살 적다."""
    today = today or date.today()
    age = today.year - birth_date.year
    if (today.month, today.day) < (birth_date.month, birth_date.day):
        age -= 1
    return age


def verify_min_age(birth_date: date, today: date | None = None) -> int:
    """만 14세 이상인지 확인한다. 미만이면 AgeVerificationError."""
    today = today or date.today()

    if birth_date > today:
        raise AgeVerificationError("생년월일이 올바르지 않습니다.")
    # 현존 최고령자를 넘는 값은 오입력으로 본다.
    if today.year - birth_date.year > 130:
        raise AgeVerificationError("생년월일이 올바르지 않습니다.")

    age = calculate_age(birth_date, today)
    if age < MIN_AGE:
        raise AgeVerificationError(
            f"만 {MIN_AGE}세 미만은 가입할 수 없습니다. "
            "본 서비스는 취업 준비를 지원하는 서비스로 아동의 개인정보를 처리하지 않습니다."
        )
    return age
