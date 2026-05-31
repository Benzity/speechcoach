"""audio_worker 보조 함수 테스트 (librosa 의존 분리)."""
from app.workers.audio_worker import _count_syllables


def test_korean_syllable_count():
    assert _count_syllables("안녕하세요") == 5
    assert _count_syllables("어려운 과제였어요") == 8  # 어려운(3) + 과제였어요(5)


def test_empty_and_whitespace():
    assert _count_syllables("") == 0
    assert _count_syllables("    ") == 0
    assert _count_syllables("!@#%^&*()") == 0


def test_mixed_korean_english():
    # "Python으로 개발한다" → Python(1단어→1) + 으로개발한다(6) = 7
    assert _count_syllables("Python으로 개발한다") == 7


def test_punctuation_and_numbers_ignored():
    # 숫자/문장부호는 카운트 안 됨
    assert _count_syllables("3000명, 정말 대단합니다!") == 7  # 명정말대단합니다 = 7


def test_realistic_answer():
    text = "어려운 과제였던 데이터 파이프라인 자동화에 직접 도전했습니다"
    expected = 3 + 4 + 3 + 6 + 5 + 2 + 6  # = 29
    assert _count_syllables(text) == expected
