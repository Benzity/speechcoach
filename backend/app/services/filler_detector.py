"""한국어/영어 필러워드 + 버벅거림 감지 (FR-4.9, FR-4.12)."""
import re

# 한국어 필러워드 (29종)
KOREAN_FILLERS = [
    "어", "음", "그", "저", "그러니까", "그래서", "그게", "뭐랄까",
    "있잖아", "뭐", "이제", "근데", "막", "약간", "쫌", "좀", "뭐냐",
    "음...", "어...", "그 뭐지", "그 머지", "어떻게 보면", "솔직히",
    "사실", "그러게", "아니", "응", "예", "네",
]

# 영어 필러워드 (17종)
ENGLISH_FILLERS = [
    "um", "uh", "er", "ah", "like", "you know", "so", "well",
    "basically", "actually", "literally", "right", "okay",
    "i mean", "kinda", "sort of", "alright",
]

ALL_FILLERS = KOREAN_FILLERS + ENGLISH_FILLERS

_ENGLISH_ONLY = re.compile(r"^[a-zA-Z\s]+$")


def count_fillers(transcript: str) -> dict[str, int]:
    """전사 텍스트에서 필러워드 빈도를 산출 (FR-4.9)."""
    text = transcript.lower()
    counts: dict[str, int] = {}
    for w in ALL_FILLERS:
        wl = w.lower()
        if _ENGLISH_ONLY.match(w):
            pattern = r"\b" + re.escape(wl) + r"\b"
            n = len(re.findall(pattern, text))
        else:
            # 한국어 — substring count
            n = text.count(wl)
        if n > 0:
            counts[w] = n
    return counts


# 같은 단어가 연속 2회 이상 반복 (예: "그 그 그래서")
_STUTTER_PATTERN = re.compile(r"\b(\S+)(?:\s+\1\b){1,}", re.IGNORECASE)


def count_stutters(transcript: str) -> int:
    """연속 반복 단어(버벅거림) 발생 횟수 (FR-4.12)."""
    return len(_STUTTER_PATTERN.findall(transcript))
