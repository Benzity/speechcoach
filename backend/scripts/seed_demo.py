"""시연용 시드 — demo 계정 + 완료된 면접 1건.

사용:
  cd backend && .venv/bin/python -m scripts.seed_demo

DB를 미리 리셋한 다음 실행할 것 (기존 demo 계정이 있으면 멱등하지 않게 실패).
"""
import json
import uuid
from datetime import datetime, timedelta

from app.db.database import Base, SessionLocal, engine
from app.db.models import (
    Analysis as AnalysisModel,
    Feedback as FeedbackModel,
    Question as QuestionModel,
    Session as SessionModel,
    User as UserModel,
)
from app.services.auth import hash_password

DEMO_EMAIL = "demo@test.com"
DEMO_PASSWORD = "1234"

QUESTIONS = [
    {
        "text": "자기소개를 1분 내로 해주세요.",
        "category": "인성",
        "intent": "지원자의 자기 인식과 표현력 평가",
        "transcript": "안녕하세요, 저는 3년차 백엔드 개발자 데모입니다. FastAPI와 Python을 주로 다루고 있고...",
    },
    {
        "text": "최근에 진행한 프로젝트 중 가장 자랑할 만한 것을 소개해주세요.",
        "category": "경험",
        "intent": "기술 깊이와 문제 해결 능력 평가",
        "transcript": "최근에 사내 분석 파이프라인을 재설계했는데, Airflow 기반으로 바꿔서...",
    },
    {
        "text": "팀에서 갈등이 있었던 경험과 어떻게 해결했는지 알려주세요.",
        "category": "협업",
        "intent": "협업 태도와 갈등 해결 방식 평가",
        "transcript": "한번은 코드 리뷰 방식 때문에 시니어 개발자와 의견 차이가 있었는데...",
    },
]

FEEDBACK_JSON = {
    "overall_summary": (
        "전반적으로 안정적인 면접 수행을 보였습니다. 기술 답변의 구조와 내용은 강했지만, "
        "비언어적 표현(시선·자세)에서 추가 개선 여지가 있습니다."
    ),
    "scores": {"content": 82, "nonverbal": 68, "verbal": 76, "overall": 75},
    "critical_issues": [
        {
            "title": "시선이 자주 화면 아래로 향함",
            "description": "답변 도중 18회 정도 시선이 노트로 떨어졌습니다. 카메라 정면 응시를 의식적으로 연습해보세요.",
            "priority": "high",
        },
        {
            "title": "필러워드 사용 빈도가 평균보다 높음",
            "description": "'음', '어' 등의 표현이 분당 6회로 측정되었습니다.",
            "priority": "medium",
        },
    ],
    "nonverbal_feedback": "전반적으로 자세는 안정적이나, 시선이 답변 도중 흔들리는 빈도가 잦습니다.",
    "verbal_feedback": "발화 속도(150 wpm)는 적절하나, 문장 끝 톤이 내려가는 패턴이 반복됩니다.",
    "practice_tips": [
        "녹화 시 카메라 렌즈에 작은 스티커를 붙여 시선 고정 연습",
        "답변 도입부 5초를 미리 외워두기",
        "필러워드 대신 짧은 침묵으로 대체하기",
    ],
    "positive_points": [
        "기술 답변에서 구체적 수치와 예시 활용",
        "협업 질문에서 구조적 STAR 답변",
    ],
}


def main() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(UserModel).filter(UserModel.email == DEMO_EMAIL).first():
            print(f"이미 {DEMO_EMAIL} 계정이 존재합니다. DB를 먼저 리셋해주세요.")
            return

        user_id = str(uuid.uuid4())
        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow() - timedelta(days=2)

        db.add(
            UserModel(
                id=user_id,
                email=DEMO_EMAIL,
                password_hash=hash_password(DEMO_PASSWORD),
                display_name="데모",
            )
        )
        db.add(
            SessionModel(
                id=session_id,
                user_id=user_id,
                job_title="백엔드 개발자",
                resume_text="Python/FastAPI 경력 3년. 사내 데이터 파이프라인 재설계 경험.",
                question_count=len(QUESTIONS),
                status="completed",
                created_at=created_at,
            )
        )

        for idx, q in enumerate(QUESTIONS):
            qid = str(uuid.uuid4())
            db.add(
                QuestionModel(
                    id=qid,
                    session_id=session_id,
                    q_index=idx,
                    text=q["text"],
                    category=q["category"],
                    intent=q["intent"],
                )
            )
            db.add(
                AnalysisModel(
                    question_id=qid,
                    video_path=None,
                    asr_transcript=q["transcript"],
                    asr_segments_json=json.dumps([]),
                    nonverbal_metrics_json=json.dumps(
                        {"gaze_off_camera_count": 18 - idx * 4, "posture_score": 0.7}
                    ),
                    verbal_metrics_json=json.dumps(
                        {"wpm": 150, "filler_per_min": 6, "pitch_std": 28}
                    ),
                    status="completed",
                    started_at=created_at,
                    completed_at=created_at + timedelta(minutes=1),
                )
            )

        db.add(
            FeedbackModel(
                session_id=session_id,
                llm_response_json=json.dumps(FEEDBACK_JSON, ensure_ascii=False),
                created_at=created_at + timedelta(minutes=2),
            )
        )

        db.commit()
        print(f"✓ 시드 완료: {DEMO_EMAIL} / {DEMO_PASSWORD} (세션 1건)")
    finally:
        db.close()


if __name__ == "__main__":
    main()
