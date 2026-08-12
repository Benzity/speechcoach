"""세션 종료 후 누적 데이터 → Claude API → 종합 피드백 (UC-06 / FR-5.x)."""
import json
import logging
from typing import Any

from anthropic import Anthropic, APIError

from app.core.config import ANTHROPIC_API_KEY, CLAUDE_MODEL

logger = logging.getLogger(__name__)


class FeedbackGenerationError(Exception):
    """사용자에게 그대로 노출 가능한 한국어 메시지."""


REQUIRED_KEYS = [
    "overall_summary",
    "scores",
    "critical_issues",
    "nonverbal_feedback",
    "verbal_feedback",
    "practice_tips",
    "positive_points",
]

SYSTEM_PROMPT_KO = """당신은 시니어 면접관이자 커뮤니케이션 코치입니다.
모의면접 분석 데이터를 받아 종합 피드백을 생성합니다.

피드백 원칙:
1. 비언어/반언어 지표는 ASR 전사와 함께 종합적으로 해석
2. 정량 데이터를 그대로 나열하지 말고 인사이트로 변환
3. 비판적이되 건설적, 한국어 자연스러운 코치 톤
4. 답변의 내용(직무 적합성)에 대한 피드백도 포함
5. 응답은 반드시 명시된 JSON 스키마

[ASR 전사 해석 주의]
- asr_transcript는 자동 음성인식(ASR) 결과로 부정확할 수 있습니다. 특히 영어 용어가
  한글로 음차되거나(예: "query source"→"퀄리소스", "log"→"로우") 발음을 잘못 옮길 수 있습니다.
- 이러한 전사상의 오인식은 답변자의 잘못이 아니므로 감점·지적 근거로 삼지 마세요.
- "전사 결과를 보면 ~단어가 부정확하게 인식되었다"처럼 ASR 품질 자체를 언급하거나
  평가하지 마세요. 피드백은 답변 내용·전달력에 집중합니다.
- 내용 평가는 문맥으로 본래 의도를 추정해 수행하되, 전사 오류로 의미가 불분명한
  구간은 평가를 보류하고 추측성 감점을 하지 마세요."""

SYSTEM_PROMPT_EN = """You are a senior interviewer and communication coach.
You receive mock-interview analysis data and produce comprehensive feedback.

Feedback principles:
1. Interpret nonverbal/paraverbal metrics holistically together with the ASR transcript
2. Turn quantitative data into insights instead of listing raw numbers
3. Critical but constructive, in a natural English coaching tone
4. Also give feedback on answer content (fitness for the role)
5. The response must strictly follow the specified JSON schema

[Notes on interpreting the ASR transcript]
- asr_transcript comes from automatic speech recognition and may contain errors:
  misheard words, dropped words, or wrong technical terms.
- Such transcription errors are not the candidate's fault — never use them as grounds
  for criticism or lower scores.
- Do not comment on or evaluate ASR quality itself (e.g. "the transcript shows word X
  was recognized incorrectly"). Focus feedback on content and delivery.
- Infer the intended meaning from context when evaluating content; where a passage is
  unclear due to transcription errors, withhold judgment rather than guessing and
  penalizing."""

SYSTEM_PROMPTS = {"ko": SYSTEM_PROMPT_KO, "en": SYSTEM_PROMPT_EN}


def _has_vision_data(questions: list[dict[str, Any]]) -> bool:
    """질문 중 하나라도 비언어 메트릭에 실제 값이 들어있는지."""
    for q in questions:
        m = q.get("nonverbal_metrics")
        if isinstance(m, dict) and m:
            return True
    return False


def _build_user_prompt(payload: dict[str, Any]) -> str:
    language = payload.get("language", "ko")
    vision_available = _has_vision_data(payload.get("questions", []))

    if language == "en":
        ideal_section = (
            f"\n[Ideal candidate profile / hiring criteria]\n{payload['ideal_profile']}\n"
            if payload.get("ideal_profile")
            else ""
        )
        if vision_available:
            nonverbal_rule = (
                '"nonverbal": integer 0-100,  // based on gaze/posture and other nonverbal analysis\n'
            )
            nonverbal_feedback_rule = (
                '"nonverbal_feedback": "overall feedback on gaze/posture/expression/hands",'
            )
            constraints = ""
        else:
            nonverbal_rule = '"nonverbal": null,  // no video analysis data -> must be null\n'
            nonverbal_feedback_rule = (
                '"nonverbal_feedback": "Video analysis could not be performed, so nonverbal '
                'delivery (gaze, posture, expression, hands) is not evaluated.",'
            )
            constraints = (
                "\n[Important constraints]\n"
                "- This session has no video analysis data.\n"
                "- scores.nonverbal must be null. Do not guess a score.\n"
                "- nonverbal_feedback must state that the analysis was not performed, as shown above.\n"
                "- Do not include nonverbal items (gaze, posture, expression) in critical_issues.\n"
                "- Compute scores.overall from content and verbal only.\n"
            )

        return f"""Generate a comprehensive feedback JSON based on the mock-interview data below.

[Role]
{payload["job_title"]}
{ideal_section}
[Resume summary]
{payload["resume_text"][:1500]}

[Per-question answer data]
{json.dumps(payload["questions"], ensure_ascii=False, indent=2)}
{constraints}
[Response format]
- Output only a JSON object, no other text
- All text in English
- Schema:
{{
  "overall_summary": "one paragraph (3-5 sentences) evaluating the whole interview",
  "scores": {{
    "content": integer 0-100,
    {nonverbal_rule}    "verbal": integer 0-100,
    "overall": integer 0-100
  }},
  "critical_issues": [
    {{"title": "...", "description": "...", "priority": "high|medium|low"}}
  ],
  {nonverbal_feedback_rule}
  "verbal_feedback": "overall feedback on tone/pace/filler words/silences (long_silences_count is the number of silences of 1.5s or longer; 1-2 occurrences are normal, do not over-criticize)",
  "practice_tips": ["3-5 actionable practice tips"],
  "positive_points": ["2-4 strengths"]
}}
"""

    ideal_section = f"\n[인재상/채용 기준]\n{payload['ideal_profile']}\n" if payload.get("ideal_profile") else ""

    if vision_available:
        nonverbal_rule = (
            '"nonverbal": 0~100 정수,  // 시선/자세 등 비언어 분석 결과 기반\n'
        )
        nonverbal_feedback_rule = '"nonverbal_feedback": "시선/자세/표정/손 관련 종합 피드백",'
        constraints = ""
    else:
        nonverbal_rule = '"nonverbal": null,  // 비디오 분석 데이터 없음 → 반드시 null\n'
        nonverbal_feedback_rule = (
            '"nonverbal_feedback": "비디오 분석을 수행하지 못해 비언어 표현(시선·자세·표정·손)은 평가하지 않습니다.",'
        )
        constraints = (
            "\n[중요 제약]\n"
            "- 이번 세션에는 비디오 분석 데이터가 없습니다.\n"
            "- scores.nonverbal은 반드시 null로 출력하세요. 추측해서 점수를 매기지 마세요.\n"
            "- nonverbal_feedback은 위 형식대로 분석 미수행을 명시하세요.\n"
            "- critical_issues에 시선·자세·표정 같은 비언어 항목을 포함하지 마세요.\n"
            "- scores.overall은 content와 verbal만으로 산정하세요.\n"
        )

    return f"""아래 모의면접 데이터를 기반으로 종합 피드백 JSON을 생성해주세요.

[직무]
{payload["job_title"]}
{ideal_section}
[이력서 요약]
{payload["resume_text"][:1500]}

[질문별 답변 데이터]
{json.dumps(payload["questions"], ensure_ascii=False, indent=2)}
{constraints}
[응답 형식]
- 다른 설명 없이 JSON 객체만 출력
- 모든 텍스트는 한국어
- 스키마:
{{
  "overall_summary": "한 단락(3~5문장)으로 전체 평가",
  "scores": {{
    "content": 0~100 정수,
    {nonverbal_rule}    "verbal": 0~100 정수,
    "overall": 0~100 정수
  }},
  "critical_issues": [
    {{"title": "...", "description": "...", "priority": "high|medium|low"}}
  ],
  {nonverbal_feedback_rule}
  "verbal_feedback": "어조/속도/필러워드/침묵 관련 종합 피드백 (long_silences_count는 1.5초 이상 침묵 횟수로, 1~2회는 정상 범주이니 과도하게 지적하지 말 것)",
  "practice_tips": ["실천 팁 3~5개"],
  "positive_points": ["잘하는 점 2~4개"]
}}
"""


def generate_feedback(payload: dict[str, Any]) -> dict[str, Any]:
    if not ANTHROPIC_API_KEY:
        raise FeedbackGenerationError(
            "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다."
        )

    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    user_prompt = _build_user_prompt(payload)

    logger.info(
        "종합 피드백 생성 요청 model=%s questions=%d lang=%s",
        CLAUDE_MODEL, len(payload["questions"]), payload.get("language", "ko"),
    )
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPTS.get(payload.get("language", "ko"), SYSTEM_PROMPT_KO),
            messages=[{"role": "user", "content": user_prompt}],
        )
    except APIError as e:
        logger.exception("Claude 피드백 API 실패")
        raise FeedbackGenerationError(
            f"Claude API 호출에 실패했습니다: {e}. 잠시 후 다시 시도해주세요."
        ) from e

    raw = "".join(b.text for b in response.content if getattr(b, "type", None) == "text").strip()
    text = _strip_code_fence(raw)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        logger.error("피드백 JSON 파싱 실패. 앞부분: %r", raw[:500])
        raise FeedbackGenerationError(
            "Claude 응답을 JSON으로 해석할 수 없습니다."
        ) from e

    missing = [k for k in REQUIRED_KEYS if k not in data]
    if missing:
        raise FeedbackGenerationError(f"응답에 필수 키가 빠졌습니다: {missing}")
    return data


def _strip_code_fence(text: str) -> str:
    s = text.strip()
    if s.startswith("```"):
        s = s.split("\n", 1)[1] if "\n" in s else s[3:]
        if s.endswith("```"):
            s = s[:-3]
    return s.strip()
