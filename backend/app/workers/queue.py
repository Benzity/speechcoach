"""분석 작업 큐 (외부 — 질문 간 직렬 처리).

Phase 0 결정:
- 외부 큐는 ThreadPoolExecutor(max_workers=1)로 GPU 경합 회피
- 작업 내부에서 Vision/Audio는 별도 ThreadPool로 병렬 (pipeline.py)
- 큐 진행 상태는 analyses 테이블에 영속화 (DB가 진실)
"""
import logging
from concurrent.futures import ThreadPoolExecutor

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(max_workers=1, thread_name_prefix="analysis")


def submit_analysis(question_id: str) -> None:
    """질문 ID로 분석 작업을 큐에 등록한다 (fire-and-forget)."""
    logger.info("분석 큐 등록 question_id=%s", question_id)
    _executor.submit(_run_safely, question_id)


def _run_safely(question_id: str) -> None:
    """워커 크래시가 다른 작업에 전파되지 않도록 격리 (NFR-3.3)."""
    from app.workers.pipeline import run_analysis_for_question  # lazy import

    try:
        run_analysis_for_question(question_id)
    except Exception:
        logger.exception("분석 워커 실패 question_id=%s", question_id)
