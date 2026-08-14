"""SRS 4.3.2의 7개 엔드포인트 (전체 구현)."""
import json
import logging
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session as DbSession

from app.core.config import VIDEO_DIR
from app.core.deps import get_current_user
from app.db.database import get_db
from app.db.models import Analysis as AnalysisModel
from app.db.models import Feedback as FeedbackModel
from app.db.models import Question as QuestionModel
from app.db.models import Session as SessionModel
from app.db.models import User as UserModel
from app.schemas.sessions import (
    AnalysisStatusResponse,
    AnswerUploadResponse,
    FeedbackTriggerResponse,
    SessionRead,
    SessionResultResponse,
)
from app.services.feedback_generator import FeedbackGenerationError, generate_feedback
from app.services.pii_masker import mask_pii, mask_report
from app.services.question_generator import QuestionGenerationError, generate_questions
from app.services.resume_parser import ResumeParseError, extract_text_from_pdf
from app.services.video_crypto import VideoCryptoError, decrypt_iter, encrypt_stream
from app.workers.queue import submit_analysis

# 업로드 상한. 법령이 수치를 정하지 않으므로 서비스 특성에 맞춘 판단값이다.
# (ASVS V5는 "상한을 문서화하고 강제할 것"을 요구하되 숫자는 지정하지 않는다.)
MAX_PDF_BYTES = 10 * 1024 * 1024  # 10MB — 텍스트 이력서로는 충분
MAX_VIDEO_BYTES = 200 * 1024 * 1024  # 200MB — 60초 webm 기준 여유
MAX_RESUME_CHARS = 50_000  # 직접 입력 텍스트 상한

logger = logging.getLogger(__name__)
# router-level 인증: 이 라우터에 추가되는 모든 엔드포인트는 기본으로 보호된다.
# 개별 함수의 Depends(get_current_user)는 current_user 값을 쓰기 위해 남겨두며,
# FastAPI가 요청 단위로 캐싱하므로 중복 조회는 발생하지 않는다.
router = APIRouter(
    prefix="/api", tags=["sessions"], dependencies=[Depends(get_current_user)]
)


def _get_owned_session(
    session_id: str, user: UserModel, db: DbSession
) -> SessionModel:
    """세션 조회 + 소유자 검증. 없거나 남의 것이면 404 (정보 노출 최소화)."""
    row = db.get(SessionModel, session_id)
    if row is None or row.user_id != user.id:
        raise HTTPException(status_code=404, detail="세션을 찾을 수 없습니다.")
    return row


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
    ideal_profile: str | None = Form(None),
    question_count: int = Form(5),
    language: str = Form("ko"),
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> SessionModel:
    if not (3 <= question_count <= 15):
        raise HTTPException(status_code=400, detail="질문 개수는 3~15 사이여야 합니다.")
    if not job_title.strip():
        raise HTTPException(status_code=400, detail="관심 직무를 입력해주세요.")
    if language not in ("ko", "en"):
        raise HTTPException(status_code=400, detail="지원하지 않는 언어입니다. (ko, en)")

    text = (resume_text or "").strip()
    if len(text) > MAX_RESUME_CHARS:
        raise HTTPException(
            status_code=413,
            detail=f"이력서 텍스트는 {MAX_RESUME_CHARS:,}자를 넘을 수 없습니다.",
        )

    if resume_pdf is not None and (resume_pdf.filename or "").strip():
        try:
            # 전체를 메모리에 올리기 전에 크기를 확인한다. 상한을 1바이트 넘겨
            # 읽어보고 초과분이 있으면 거부한다.
            content = resume_pdf.file.read(MAX_PDF_BYTES + 1)
            if len(content) > MAX_PDF_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"이력서 PDF는 {MAX_PDF_BYTES // (1024 * 1024)}MB 이하여야 합니다.",
                )
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

    # LLM(해외)으로 나가기 전에 식별정보를 지운다 (제16조 최소수집).
    # DB에도 마스킹본을 저장해, 이후 피드백 생성 시에도 원문이 새지 않게 한다.
    masked = mask_pii(text)
    found = mask_report(text)
    if found:
        logger.info("이력서 PII 마스킹 적용: %s", found)
    text = masked

    try:
        question_dicts = generate_questions(
            job_title.strip(), text, question_count, ideal_profile, language=language
        )
    except QuestionGenerationError as e:
        logger.error("질문 생성 실패: %s", e)
        raise HTTPException(status_code=502, detail=str(e)) from e

    session_id = str(uuid.uuid4())
    session_row = SessionModel(
        id=session_id,
        user_id=current_user.id,
        job_title=job_title.strip(),
        resume_text=text,
        ideal_profile=ideal_profile.strip() if ideal_profile else None,
        question_count=question_count,
        language=language,
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
def get_session(
    session_id: str,
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> SessionModel:
    return _get_owned_session(session_id, current_user, db)


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
    current_user: UserModel = Depends(get_current_user),
) -> AnswerUploadResponse:
    session_row = _get_owned_session(session_id, current_user, db)

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

    # 업로드를 읽으면서 크기를 검사하고, 그대로 암호화해 저장한다.
    # 평문이 디스크에 닿지 않도록 스트림 중간에서 암호화한다
    # (안전성 확보조치 기준 제7조).
    def _bounded_chunks():
        total = 0
        while True:
            chunk = video.file.read(1024 * 1024)
            if not chunk:
                break
            total += len(chunk)
            if total > MAX_VIDEO_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"답변 영상은 {MAX_VIDEO_BYTES // (1024 * 1024)}MB 이하여야 합니다.",
                )
            yield chunk

    try:
        encrypt_stream(_bounded_chunks(), video_path)
    except HTTPException:
        # 상한 초과 등으로 중단된 경우 쓰다 만 파일을 남기지 않는다.
        video_path.unlink(missing_ok=True)
        raise
    except VideoCryptoError as e:
        video_path.unlink(missing_ok=True)
        logger.error("영상 암호화 실패: %s", e)
        raise HTTPException(status_code=500, detail=str(e)) from e
    finally:
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
    session_id: str,
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> AnalysisStatusResponse:
    _get_owned_session(session_id, current_user, db)

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
    session_id: str,
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> FeedbackTriggerResponse:
    session_row = _get_owned_session(session_id, current_user, db)

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
        "ideal_profile": session_row.ideal_profile,
        "language": session_row.language,
        "questions": payload_questions,
    }

    session_row.status = "analyzing"
    db.commit()

    try:
        feedback_json = generate_feedback(payload)
    except Exception as e:
        # FeedbackGenerationError 외(네트워크 타임아웃 등)에도 세션이 "analyzing"
        # 좀비 상태로 남지 않도록 모두 failed로 전환한다.
        logger.exception("피드백 생성 실패")
        session_row.status = "failed"
        db.commit()
        code = 502 if isinstance(e, FeedbackGenerationError) else 500
        raise HTTPException(status_code=code, detail=str(e)) from e

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
    session_id: str,
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
) -> SessionResultResponse:
    session_row = _get_owned_session(session_id, current_user, db)

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
def stream_answer_video(
    session_id: str,
    q_index: int,
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    _get_owned_session(session_id, current_user, db)
    video_path = VIDEO_DIR / session_id / f"{q_index}.webm"
    if not video_path.exists():
        raise HTTPException(status_code=404, detail="영상 파일을 찾을 수 없습니다.")

    # 저장본이 암호화되어 있으므로 복호화하며 스트리밍한다.
    # 평문 임시 파일을 만들지 않으므로 노출 창이 없다.
    # (Range 요청은 지원하지 않는다 — 청크 암호화라 임의 지점 탐색이 불가능하다.
    #  현재 프론트엔드는 blob으로 전체를 받아 재생하므로 문제되지 않는다.)
    #
    # decrypt_iter는 제너레이터라 호출만으로는 본문이 실행되지 않는다. 매직 헤더·키
    # 검증을 응답 헤더가 나가기 전에 끝내야 500으로 응답할 수 있으므로, 첫 청크를
    # 미리 당겨 검증을 강제한다. 스트리밍 시작 후에는 이미 200이 나간 뒤라
    # 상태코드를 바꿀 수 없다.
    stream = decrypt_iter(video_path)
    try:
        first = next(stream, b"")
    except VideoCryptoError as e:
        logger.error("영상 복호화 실패 session=%s q=%d: %s", session_id, q_index, e)
        raise HTTPException(status_code=500, detail="영상을 읽을 수 없습니다.") from e

    def _body():
        yield first
        yield from stream

    return StreamingResponse(
        _body(),
        media_type="video/webm",
        headers={"Content-Disposition": f'inline; filename="{q_index}.webm"'},
    )


@router.delete(
    "/sessions/{session_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="세션 삭제 (DB cascade + 영상 디렉토리)",
)
def delete_session(
    session_id: str,
    db: DbSession = Depends(get_db),
    current_user: UserModel = Depends(get_current_user),
):
    import shutil

    session_row = _get_owned_session(session_id, current_user, db)

    video_dir = VIDEO_DIR / session_id
    if video_dir.exists():
        shutil.rmtree(video_dir, ignore_errors=True)

    db.delete(session_row)
    db.commit()
    logger.info("세션 삭제 session=%s user=%s", session_id, current_user.id)


def _safe_json(raw: str | None):
    if not raw:
        return None
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None
