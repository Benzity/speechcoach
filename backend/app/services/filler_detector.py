"""한국어/영어 필러워드 + 버벅거림 감지 (FR-4.9, FR-4.12)."""
import re

# 한국어 필러워드 — 어절 단위 정확 매칭 (1글자도 단독 어절일 때만 카운트)
# 일상어 빈도가 높은 '솔직히/사실/그러게/아니/응/예/네'는 제외 (정상 답변 오탐 다발)
KOREAN_FILLERS = [
    "어", "음", "그", "저", "그러니까", "그래서", "그게", "뭐랄까",
    "있잖아", "뭐", "이제", "근데", "막", "약간", "쫌", "좀", "뭐냐",
    "그 뭐지", "그 머지", "어떻게 보면",
]

ENGLISH_FILLERS = [
    "um", "uh", "er", "ah", "like", "you know", "so", "well",
    "basically", "actually", "literally", "right", "okay",
    "i mean", "kinda", "sort of", "alright",
]

_TOKEN_RE = re.compile(r"[가-힣a-zA-Z]+")


def count_fillers(transcript: str) -> dict[str, int]:
    """전사 텍스트에서 필러워드 빈도를 산출 (FR-4.9).

    한국어 단어절 필러는 어절 단위 정확 매칭으로 오탐 방지("어려운"의 "어" 등).
    다어절 필러(공백 포함)는 substring 우선 매칭 후 제거 → 토큰 카운트 이중계산 방지.
    """
    text = transcript.lower()
    counts: dict[str, int] = {}

    # 1) 영어 필러: 단어 경계 정규식
    for w in ENGLISH_FILLERS:
        pattern = r"\b" + re.escape(w) + r"\b"
        n = len(re.findall(pattern, text))
        if n > 0:
            counts[w] = n

    # 2) 한국어 다어절 필러 먼저 (긴 것부터) 매칭하고 텍스트에서 제거
    consumed = text
    multi = [w for w in KOREAN_FILLERS if " " in w]
    for w in sorted(multi, key=len, reverse=True):
        n = consumed.count(w)
        if n > 0:
            counts[w] = n
            consumed = consumed.replace(w, " ")

    # 3) 한국어 단어절 필러: 어절 토큰 정확 일치
    tokens = _TOKEN_RE.findall(consumed)
    for w in KOREAN_FILLERS:
        if " " in w:
            continue
        n = tokens.count(w)
        if n > 0:
            counts[w] = n

    return counts


# 같은 단어가 연속 2회 이상 반복 (예: "그 그 그래서")
_STUTTER_PATTERN = re.compile(r"\b(\S+)(?:\s+\1\b){1,}", re.IGNORECASE)


def count_stutters(transcript: str) -> int:
    """연속 반복 단어(버벅거림) 발생 횟수 (FR-4.12)."""
    return len(_STUTTER_PATTERN.findall(transcript))
