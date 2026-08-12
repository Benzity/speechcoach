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


def count_fillers(transcript: str, language: str = "ko") -> dict[str, int]:
    """전사 텍스트에서 필러워드 빈도를 산출 (FR-4.9).

    한국어 단어절 필러는 어절 단위 정확 매칭으로 오탐 방지("어려운"의 "어" 등).
    다어절 필러(공백 포함)는 substring 우선 매칭 후 제거 → 토큰 카운트 이중계산 방지.
    language="en"이면 한국어 사전을 건너뛴다 (영어 전사엔 불필요).
    """
    text = transcript.lower()
    counts: dict[str, int] = {}

    # 1) 영어 필러: 단어 경계 정규식
    for w in ENGLISH_FILLERS:
        pattern = r"\b" + re.escape(w) + r"\b"
        n = len(re.findall(pattern, text))
        if n > 0:
            counts[w] = n

    if language == "en":
        return counts

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


def extract_filler_events(segments: list[dict], language: str = "ko") -> list[dict]:
    """ASR 세그먼트별로 필러워드를 찾아 타임스탬프 이벤트로 반환 (FR-17).

    세그먼트당 필러 종류별 1개(시작 시각)만 기록 — 같은 구간 중복 표기 방지.
    """
    events: list[dict] = []
    for seg in segments:
        counts = count_fillers(seg.get("text", ""), language)
        start = round(float(seg.get("start", 0.0)), 1)
        for word in counts:
            events.append({"t": start, "label": word})
    return events
