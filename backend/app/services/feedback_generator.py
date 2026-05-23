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

SYSTEM_PROMPT = """당신은 시니어 면접관이자 커뮤니케이션 코치입니다.
모의면접 분석 데이터를 받아 종합 피드백을 생성합니다.

피드백 원칙:
1. 비언어/반언어 지표는 ASR 전사와 함께 종합적으로 해석
2. 정량 데이터를 그대로 나열하지 말고 인사이트로 변환
3. 비판적이되 건설적, 한국어 자연스러운 코치 톤
4. 답변의 내용(직무 적합성)에 대한 피드백도 포함
5. 응답은 반드시 명시된 JSON 스키마"""


def _build_user_prompt(payload: dict[str, Any]) -> str:
    ideal_section = f"\n[인재상/채용 기준]\n{payload['ideal_profile']}\n" if payload.get("ideal_profile") else ""
    return f"""아래 모의면접 데이터를 기반으로 종합 피드백 JSON을 생성해주세요.

[직무]
{payload["job_title"]}
{ideal_section}
[이력서 요약]
{payload["resume_text"][:1500]}

[질문별 답변 데이터]
{json.dumps(payload["questions"], ensure_ascii=False, indent=2)}

[응답 형식]
- 다른 설명 없이 JSON 객체만 출력
- 모든 텍스트는 한국어
- 스키마:
{{
  "overall_summary": "한 단락(3~5문장)으로 전체 평가",
  "scores": {{
    "content": 0~100 정수,
    "nonverbal": 0~100 정수,
    "verbal": 0~100 정수,
    "overall": 0~100 정수
  }},
  "critical_issues": [
    {{"title": "...", "description": "...", "priority": "high|medium|low"}}
  ],
  "nonverbal_feedback": "시선/자세/표정/손 관련 종합 피드백",
  "verbal_feedback": "어조/속도/필러워드/침묵 관련 종합 피드백",
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
        "종합 피드백 생성 요청 model=%s questions=%d",
        CLAUDE_MODEL, len(payload["questions"]),
    )
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
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
