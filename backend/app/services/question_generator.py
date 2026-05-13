"""Claude API로 N개 면접 질문을 일괄 생성 (UC-02 / FR-2.x)."""
import json
import logging
from typing import Any

from anthropic import Anthropic, APIError

from app.core.config import ANTHROPIC_API_KEY, CLAUDE_MODEL

logger = logging.getLogger(__name__)


class QuestionGenerationError(Exception):
    """사용자에게 그대로 노출 가능한 한국어 메시지를 담는다."""


SYSTEM_PROMPT = """당신은 시니어 면접관이자 채용 컨설턴트입니다.
사용자의 관심 직무와 이력서를 바탕으로 깊이 있는 면접 질문을 생성합니다.

질문 생성 원칙:
1. 직무 적합성을 검증할 수 있는 실무 중심 질문을 포함
2. 이력서의 구체적 경험을 다시 묻거나 깊이 있게 파고드는 질문 포함
3. 인성·동기·협업 질문도 1~2개 포함
4. 표면적 지식 질문(예: "OOP가 무엇인가요?") 지양
5. 모든 질문은 한국어로, 자연스러운 면접관 톤"""


def _build_user_prompt(job_title: str, resume_text: str, n: int) -> str:
    return f"""아래 후보자에 대해 면접 질문을 정확히 {n}개 생성해주세요.

[관심 직무]
{job_title}

[이력서]
{resume_text}

[응답 형식]
- 다른 설명/문장 없이 JSON 객체만 출력.
- 스키마:
{{
  "questions": [
    {{
      "id": "q1",
      "text": "면접 질문 본문",
      "category": "technical | behavioral | motivation | experience | culture_fit 중 하나",
      "intent": "이 질문으로 평가하려는 의도를 한 줄"
    }}
  ]
}}
- id는 q1, q2, ..., q{n} 순서.
- 정확히 {n}개 질문.
"""


def generate_questions(job_title: str, resume_text: str, n: int) -> list[dict[str, Any]]:
    if not ANTHROPIC_API_KEY:
        raise QuestionGenerationError(
            "서버에 ANTHROPIC_API_KEY가 설정되어 있지 않습니다. 관리자에게 문의해주세요."
        )

    client = Anthropic(api_key=ANTHROPIC_API_KEY)
    user_prompt = _build_user_prompt(job_title, resume_text, n)

    logger.info("Claude 질문 생성 요청 model=%s n=%d", CLAUDE_MODEL, n)
    try:
        response = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except APIError as e:
        logger.exception("Claude API 호출 실패")
        raise QuestionGenerationError(
            f"Claude API 호출에 실패했습니다: {e}. 잠시 후 다시 시도해주세요."
        ) from e

    raw = "".join(b.text for b in response.content if getattr(b, "type", None) == "text").strip()
    return _parse_and_validate(raw, n)


def _parse_and_validate(raw: str, expected_n: int) -> list[dict[str, Any]]:
    text = _strip_code_fence(raw)
    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        logger.error("JSON 파싱 실패. 원본 앞부분: %r", raw[:500])
        raise QuestionGenerationError(
            "Claude 응답을 JSON으로 해석할 수 없습니다. 재시도해주세요."
        ) from e

    questions = data.get("questions")
    if not isinstance(questions, list) or not questions:
        raise QuestionGenerationError("Claude 응답에 'questions' 배열이 없습니다.")

    if len(questions) < expected_n:
        raise QuestionGenerationError(
            f"요청한 질문 수({expected_n})보다 적게 생성되었습니다({len(questions)}). 재시도해주세요."
        )
    questions = questions[:expected_n]

    cleaned: list[dict[str, Any]] = []
    for i, q in enumerate(questions):
        if not isinstance(q, dict) or not isinstance(q.get("text"), str) or not q["text"].strip():
            raise QuestionGenerationError(f"질문 {i + 1}의 형식이 올바르지 않습니다.")
        cleaned.append(
            {
                "id": q.get("id") or f"q{i + 1}",
                "text": q["text"].strip(),
                "category": q.get("category"),
                "intent": q.get("intent"),
            }
        )
    return cleaned


def _strip_code_fence(text: str) -> str:
    """Claude가 가끔 ```json ... ```로 감싸는 경우 제거."""
    s = text.strip()
    if s.startswith("```"):
        # 첫 줄(``` 또는 ```json) 제거
        s = s.split("\n", 1)[1] if "\n" in s else s[3:]
        if s.endswith("```"):
            s = s[: -3]
    return s.strip()
