"""SRS 4.3.2의 7개 엔드포인트 (전체 구현)."""
import json
import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session as DbSession

from app.core.config import VIDEO_DIR
from app.db.database import get_db
from app.db.models import Analysis as AnalysisModel
from app.db.models import Feedback as FeedbackModel
from app.db.models import Question as QuestionModel
from app.db.models import Session as SessionModel
from app.schemas.sessions import (
    AnalysisStatusResponse,
    AnswerUploadResponse,
    FeedbackTriggerResponse,
    SessionRead,
    SessionResultResponse,
)
from app.services.feedback_generator import FeedbackGenerationError, generate_feedback
from app.services.question_generator import QuestionGenerationError, generate_questions
from app.services.resume_parser import ResumeParseError, extract_text_from_pdf
from app.workers.queue import submit_analysis

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api", tags=["sessions"])


@router.post(
    "/sessions",
    response_model=SessionRead,
    status_code=status.HTTP_201_CREATED,
    summary="새 세션 생성 + 질문 N개 사전 생성 (UC-01, UC-02)",
)
def create_session(
    job_title: str = Form(...),
    resume_text: str | None = Form(None),
    resume_pdf: UploadFile | None = File(None),
    question_count: int = Form(5),
    db: DbSession = Depends(get_db),
) -> SessionModel:
    if not (3 <= question_count <= 15):
        raise HTTPException(status_code=400, detail="질문 개수는 3~15 사이여야 합니다.")
    if not job_title.strip():
        raise HTTPException(status_code=400, detail="관심 직무를 입력해주세요.")

    text = (resume_text or "").strip()
    if resume_pdf is not None and (resume_pdf.filename or "").strip():
        try:
            content = resume_pdf.file.read()
            text = extract_text_from_pdf(content)
        except ResumeParseError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e
        finally:
            resume_pdf.file.close()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="이력서 텍스트를 입력하거나 PDF 파일을 업로드해주세요.",
        )

    try:
        question_dicts = generate_questions(job_title.strip(), text, question_count)
    except QuestionGenerationError as e:
        logger.error("질문 생성 실패: %s", e)
        raise HTTPException(status_code=502, detail=str(e)) from e

    session_id = str(uuid.uuid4())
    session_row = SessionModel(
        id=session_id,
        job_title=job_title.strip(),
        resume_text=text,
        question_count=question_count,
        status="created",
    )
    db.add(session_row)
    for idx, q in enumerate(question_dicts):
        db.add(
            QuestionModel(
                id=str(uuid.uuid4()),
                session_id=session_id,
                q_index=idx,
                text=q["text"],
                category=q.get("category"),
                intent=q.get("intent"),
            )
        )
    db.commit()
    db.refresh(session_row)
    logger.info("세션 생성 완료 id=%s n=%d", session_id, question_count)
    return session_row


@router.get(
    "/sessions/{session_id}",
    response_model=SessionRead,
    summary="세션 상태 + 질문 목록 조회",
)
def get_session(session_id: str, db: DbSession = Depends(get_db)) -> SessionModel:
    row = db.get(SessionModel, session_id)
    if not row:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    return row


@router.post(
    "/sessions/{session_id}/answers/{q_index}",
    response_model=AnswerUploadResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="단일 질문 답변 영상 업로드 (UC-03, FR-3.6/3.7)",
)
def upload_answer(
    session_id: str,
    q_index: int,
    video: UploadFile = File(...),
    db: DbSession = Depends(get_db),
) -> AnswerUploadResponse:
    session_row = db.get(SessionModel, session_id)
    if not session_row:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    question = (
        db.query(QuestionModel)
        .filter_by(session_id=session_id, q_index=q_index)
        .first()
    )
    if not question:
        raise HTTPException(status_code=404, detail="해당 질문을 찾을 수 없습니다.")

    session_dir = VIDEO_DIR / session_id
    session_dir.mkdir(parents=True, exist_ok=True)
    video_path = session_dir / f"{q_index}.webm"

    with open(video_path, "wb") as f:
        while True:
            chunk = video.file.read(1024 * 1024)
            if not chunk:
                break
            f.write(chunk)
    video.file.close()

    analysis = db.get(AnalysisModel, question.id)
    if analysis is None:
        analysis = AnalysisModel(
            question_id=question.id,
            video_path=str(video_path),
            status="queued",
        )
        db.add(analysis)
    else:
        analysis.video_path = str(video_path)
        analysis.status = "queued"
        analysis.started_at = None
        analysis.completed_at = None
        analysis.asr_transcript = None
        analysis.asr_segments_json = None
        analysis.nonverbal_metrics_json = None
        analysis.verbal_metrics_json = None

    if session_row.status == "created":
        session_row.status = "in_progress"

    db.commit()
    submit_analysis(question.id)

    logger.info(
        "영상 업로드 완료 session=%s q=%d size=%d",
        session_id, q_index, video_path.stat().st_size,
    )
    return AnswerUploadResponse(
        question_id=question.id,
        q_index=q_index,
        status="queued",
    )


@router.get(
    "/sessions/{session_id}/analysis-status",
    response_model=AnalysisStatusResponse,
    summary="세션 내 모든 질문의 분석 진행 상태 (FR-5.1/5.2)",
)
def get_analysis_status(
    session_id: str, db: DbSession = Depends(get_db)
) -> AnalysisStatusResponse:
    session_row = db.get(SessionModel, session_id)
    if not session_row:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    questions = db.query(QuestionModel).filter_by(session_id=session_id).all()
    counts = {"queued": 0, "processing": 0, "completed": 0, "failed": 0}
    for q in questions:
        a = db.get(AnalysisModel, q.id)
        if a is None:
            counts["queued"] += 1
        else:
            counts[a.status] = counts.get(a.status, 0) + 1

    return AnalysisStatusResponse(
        total=len(questions),
        queued=counts["queued"],
        in_progress=counts["processing"],
        completed=counts["completed"],
        failed=counts["failed"],
    )


@router.post(
    "/sessions/{session_id}/feedback",
    response_model=FeedbackTriggerResponse,
    summary="종합 피드백 생성 (UC-06, FR-5.x). 동기 호출 — 응답까지 5~15초.",
)
def trigger_feedback(
    session_id: str, db: DbSession = Depends(get_db)
) -> FeedbackTriggerResponse:
    session_row = db.get(SessionModel, session_id)
    if not session_row:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    if db.get(FeedbackModel, session_id):
        # 이미 생성된 피드백 — idempotent
        return FeedbackTriggerResponse(session_id=session_id, status="completed")

    questions = (
        db.query(QuestionModel)
        .filter_by(session_id=session_id)
        .order_by(QuestionModel.q_index)
        .all()
    )
    if not questions:
        raise HTTPException(status_code=400, detail="질문이 없습니다.")

    not_done: list[int] = []
    for q in questions:
        a = db.get(AnalysisModel, q.id)
        if a is None or a.status not in ("completed", "failed"):
            not_done.append(q.q_index)
    if not_done:
        raise HTTPException(
            status_code=409,
            detail=f"아직 분석이 끝나지 않은 질문이 있습니다: {not_done}",
        )

    payload_questions: list[dict] = []
    for q in questions:
        a = db.get(AnalysisModel, q.id)
        item: dict = {
            "q_index": q.q_index,
            "question_text": q.text,
            "category": q.category,
            "intent": q.intent,
            "analysis_status": a.status if a else "missing",
        }
        if a and a.status == "completed":
            item["asr_transcript"] = a.asr_transcript or ""
            item["nonverbal_metrics"] = _safe_json(a.nonverbal_metrics_json)
            item["verbal_metrics"] = _safe_json(a.verbal_metrics_json)
        payload_questions.append(item)

    payload = {
        "job_title": session_row.job_title,
        "resume_text": session_row.resume_text,
        "questions": payload_questions,
    }

    session_row.status = "analyzing"
    db.commit()

    try:
        feedback_json = generate_feedback(payload)
    except FeedbackGenerationError as e:
        logger.error("피드백 생성 실패: %s", e)
        session_row.status = "failed"
        db.commit()
        raise HTTPException(status_code=502, detail=str(e)) from e

    feedback_row = FeedbackModel(
        session_id=session_id,
        llm_response_json=json.dumps(feedback_json, ensure_ascii=False),
    )
    db.add(feedback_row)
    session_row.status = "completed"
    db.commit()
    logger.info("종합 피드백 저장 session=%s", session_id)
    return FeedbackTriggerResponse(session_id=session_id, status="completed")


@router.get(
    "/sessions/{session_id}/result",
    response_model=SessionResultResponse,
    summary="결과 페이지용 최종 데이터 (세션 + 질문 + 분석 + 피드백)",
)
def get_result(
    session_id: str, db: DbSession = Depends(get_db)
) -> SessionResultResponse:
    session_row = db.get(SessionModel, session_id)
    if not session_row:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")

    analyses = [db.get(AnalysisModel, q.id) for q in session_row.questions]
    feedback_row = db.get(FeedbackModel, session_id)

    return SessionResultResponse(
        session=session_row,
        analyses=[a for a in analyses if a is not None],
        feedback=feedback_row,
    )


@router.get(
    "/sessions/{session_id}/answers/{q_index}/video",
    summary="녹화 영상 스트리밍 (FR-6.2). starlette FileResponse가 Range 자동 지원.",
    responses={200: {"content": {"video/webm": {}}}},
)
def stream_answer_video(session_id: str, q_index: int):
    video_path = VIDEO_DIR / session_id / f"{q_index}.webm"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="영상 파일을 찾을 수 없습니다.")
    return FileResponse(video_path, media_type="video/webm")


def _safe_json(raw: str | None):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
