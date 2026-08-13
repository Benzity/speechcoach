"""이력서 PII 마스킹 — LLM 전송 전 최소수집 처리 (제16조).

이력서 원문은 Claude API(미국)로 전송된다. 면접 질문·피드백 생성에 실제로
필요한 것은 경력·기술·프로젝트 내용이지 연락처가 아니므로, 전송 전에
식별정보를 제거한다. 목적 달성에 필요한 최소한만 처리한다는 원칙에 부합하고,
전송 구간에서 유출이 나더라도 피해 범위를 줄인다.

완벽한 비식별화가 아니라 '명백한 식별자 제거'가 목표다. 이름·회사명까지
지우면 질문 품질이 무너지므로 건드리지 않는다.
"""
import re

# 주민등록번호: 6자리-7자리. 뒷자리 첫 숫자는 성별코드(1~4, 5~8은 외국인).
_RRN = re.compile(r"\b\d{6}\s*[-–—]\s*[1-8]\d{6}\b")

# 휴대폰/일반전화. 하이픈·점·공백 구분자 허용, 국가번호(+82) 포함.
_PHONE = re.compile(
    r"(?:\+?82[-.\s]?)?0?1[0-9][-.\s]?\d{3,4}[-.\s]?\d{4}\b"
    r"|\b0\d{1,2}[-.\s]\d{3,4}[-.\s]\d{4}\b"
)

_EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")

# 도로명/지번 주소로 시작하는 구간. 상세주소까지 한 덩어리로 지운다.
_ADDRESS = re.compile(
    r"(?:서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)"
    r"[^\n,]{0,40}?(?:로|길|동|읍|면|리)\s*\d[^\n,]{0,30}"
)

# 생년월일 표기 (1990.01.01 / 1990-01-01 / 1990년 1월 1일)
_BIRTH = re.compile(
    r"\b(?:19|20)\d{2}\s*[.\-/년]\s*\d{1,2}\s*[.\-/월]\s*\d{1,2}\s*일?\b"
)

_PATTERNS: list[tuple[re.Pattern[str], str]] = [
    (_RRN, "[주민등록번호]"),
    (_EMAIL, "[이메일]"),
    (_PHONE, "[전화번호]"),
    (_ADDRESS, "[주소]"),
    (_BIRTH, "[생년월일]"),
]


def mask_pii(text: str) -> str:
    """이력서 텍스트에서 명백한 식별정보를 치환한다."""
    if not text:
        return text
    masked = text
    for pattern, placeholder in _PATTERNS:
        masked = pattern.sub(placeholder, masked)
    return masked


def mask_report(text: str) -> dict[str, int]:
    """마스킹 대상이 몇 건씩 잡혔는지 집계한다 (로깅·테스트용)."""
    if not text:
        return {}
    counts: dict[str, int] = {}
    for pattern, placeholder in _PATTERNS:
        n = len(pattern.findall(text))
        if n:
            counts[placeholder] = n
    return counts
