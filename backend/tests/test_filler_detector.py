"""필러워드 탐지 단위 테스트 — 한국어 1글자 오탐 회귀 방지."""
from app.services.filler_detector import count_fillers, count_stutters


def test_korean_single_char_no_false_positive_in_normal_words():
    """'어려운/그래서/마음/막상' 같은 일반 단어에서 1글자 필러('어','그','마','막')가 잡히면 안 됨."""
    text = "어려운 과제였던 데이터 파이프라인 자동화에 직접 도전하며 직무 경계를 넓혔습니다. 어떻게든 문제를 해결하려 매달렸습니다. 어느새 구축을 완료해 업무 효율을 30% 높였고, 어떤 문제도 풀 수 있다는 자신감을 얻었습니다."
    result = count_fillers(text)
    assert "어" not in result, f"'어'가 일반 단어에서 오탐: {result}"


def test_korean_single_char_counts_only_standalone():
    """1글자 필러는 단독 어절일 때만 카운트."""
    text = "어 그게 음 그래서 마무리했어요"
    result = count_fillers(text)
    assert result.get("어") == 1
    assert result.get("음") == 1
    assert result.get("그게") == 1
    assert result.get("그래서") == 1
    # '마무리'의 '마'는 카운트되면 안 됨
    assert "마" not in result


def test_multi_word_filler_no_double_count():
    """다어절 필러('그 뭐지')가 잡힌 뒤 단어절 '그'가 추가로 카운트되면 안 됨."""
    text = "그 뭐지 잠깐만요"
    result = count_fillers(text)
    assert result.get("그 뭐지") == 1
    assert "그" not in result  # 다어절에서 소비되어 단어절 매칭 없음


def test_english_word_boundary():
    """영어 필러는 단어 경계 매칭. 'so'가 'solution'에서 잡히면 안 됨."""
    text = "I solved the solution so well basically"
    result = count_fillers(text)
    assert result.get("so") == 1
    assert result.get("well") == 1
    assert result.get("basically") == 1


def test_excluded_words_not_counted():
    """일상어 빈도 높은 '솔직히/사실/그러게/아니/응/예/네'는 제외됨."""
    text = "네 솔직히 사실 그러게요 아니 응 예"
    result = count_fillers(text)
    for excluded in ["네", "솔직히", "사실", "그러게", "아니", "응", "예"]:
        assert excluded not in result, f"제외 단어 {excluded}가 카운트됨"


def test_stutter_detection():
    text = "그 그 그래서 음 음 그게"
    assert count_stutters(text) == 2  # "그 그", "음 음"


def test_user_reported_example():
    """사용자 보고 사례: '어' 6번 오탐 시나리오 → 0이어야 함."""
    text = (
        "어려운 과제였던 데이터 파이프라인 자동화에 직접 도전하며 직무 경계를 넓혔습니다. "
        "개발 언어가 기획과 어긋나 막힐 때마다 밤낮으로 독학하며 어떻게든 문제를 해결하려 매달렸습니다. "
        "어느새 구축을 완료해 업무 효율을 30% 높였고, 어떤 문제도 풀 수 있다는 자신감을 얻었습니다."
    )
    result = count_fillers(text)
    assert "어" not in result, f"사용자 보고 예시에서 '어' 오탐: {result}"
    # '막상' 같은 단어도 없지만 '막힐'에서 '막'이 잡히면 안 됨
    assert "막" not in result
