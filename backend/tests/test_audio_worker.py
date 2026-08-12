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
    # 숫자/문장부호는 카운트 안 됨 — 명(1) + 정말(2) + 대단합니다(5) = 8
    assert _count_syllables("3000명, 정말 대단합니다!") == 8


def test_realistic_answer():
    text = "어려운 과제였던 데이터 파이프라인 자동화에 직접 도전했습니다"
    # 어려운(3) + 과제였던(4) + 데이터(3) + 파이프라인(5) + 자동화에(4) + 직접(2) + 도전했습니다(6) = 27
    expected = 3 + 4 + 3 + 5 + 4 + 2 + 6
    assert _count_syllables(text) == expected
    assert expected == 27


def test_english_syllable_estimation():
    # en 모드: 모음군 기반 추정 — beautiful(eau/i/u→3), cat(1), rhythm(y→1)
    assert _count_syllables("beautiful", "en") == 3
    assert _count_syllables("cat", "en") == 1
    assert _count_syllables("rhythm", "en") == 1


def test_english_mode_multiword():
    # I(1) + worked(o,e→2) + on(1) + it(1) = 5
    assert _count_syllables("I worked on it", "en") == 1 + 2 + 1 + 1


def test_ko_mode_unchanged_default():
    # 기본값(ko)은 기존 동작 유지
    assert _count_syllables("Python으로 개발한다") == 7
