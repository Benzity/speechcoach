"""단일 질문 분석 파이프라인 — ASR + Vision + Audio (FR-4.x, NFR-3.1)."""
import json
import logging
import subprocess
import tempfile
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from pathlib import Path
from typing import Any, Callable

from app.db.database import SessionLocal
from app.db.models import Analysis as AnalysisModel
from app.services.filler_detector import count_fillers, count_stutters, extract_filler_events

logger = logging.getLogger(__name__)


def run_analysis_for_question(question_id: str) -> None:
    """질문 1개의 영상 → ASR/Vision/Audio → DB 저장."""
    db = SessionLocal()
    audio_path: Path | None = None
    try:
        analysis = db.get(AnalysisModel, question_id)
        if not analysis or not analysis.video_path:
            logger.error("분석 레코드 없음 또는 영상 경로 없음 q=%s", question_id)
            return

        video_path = Path(analysis.video_path)
        if not video_path.exists():
            logger.error("영상 파일 없음: %s", video_path)
            _mark_failed(db, analysis)
            return

        # 세션의 면접 언어 — ASR/오디오/필러 분석의 언어를 결정
        language = analysis.question.session.language or "ko"

        analysis.status = "processing"
        analysis.started_at = datetime.utcnow()
        db.commit()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            audio_path = Path(tmp.name)

        try:
            _extract_audio(video_path, audio_path)
        except subprocess.CalledProcessError as e:
            logger.error("ffmpeg 실패 q=%s stderr=%s", question_id, e.stderr.decode(errors="ignore")[:500])
            _mark_failed(db, analysis)
            return
        except Exception:
            logger.exception("ffmpeg 호출 실패 q=%s", question_id)
            _mark_failed(db, analysis)
            return

        asr_result = _safe("ASR", _run_asr, audio_path, language)
        transcript = asr_result["transcript"] if asr_result else None
        duration = asr_result["duration"] if asr_result else _video_duration(video_path)

        with ThreadPoolExecutor(max_workers=2) as ex:
            vfut = ex.submit(_safe, "Vision", _run_vision, video_path)
            afut = ex.submit(_safe, "Audio", _run_audio, audio_path, transcript, duration, language)
            vision_result = vfut.result()
            audio_result = afut.result()

        verbal_metrics: dict[str, Any] = {}
        if audio_result:
            verbal_metrics.update(audio_result)
        if transcript:
            verbal_metrics["fillers"] = count_fillers(transcript, language)
            verbal_metrics["stutter_count"] = count_stutters(transcript)
        if asr_result and asr_result.get("segments"):
            verbal_metrics["filler_events"] = extract_filler_events(
                asr_result["segments"], language
            )

        if asr_result:
            analysis.asr_transcript = asr_result["transcript"]
            analysis.asr_segments_json = json.dumps(asr_result["segments"], ensure_ascii=False)
        if vision_result:
            analysis.nonverbal_metrics_json = json.dumps(vision_result, ensure_ascii=False)
        if verbal_metrics:
            analysis.verbal_metrics_json = json.dumps(verbal_metrics, ensure_ascii=False)

        any_success = bool(asr_result or vision_result or audio_result)
        analysis.status = "completed" if any_success else "failed"
        analysis.completed_at = datetime.utcnow()
        db.commit()
        logger.info("분석 종료 q=%s status=%s", question_id, analysis.status)

    except Exception:
        logger.exception("파이프라인 예외 q=%s", question_id)
        try:
            analysis = db.get(AnalysisModel, question_id)
            if analysis:
                analysis.status = "failed"
                analysis.completed_at = datetime.utcnow()
                db.commit()
        except Exception:
            pass
    finally:
        if audio_path is not None:
            audio_path.unlink(missing_ok=True)
        db.close()


def _mark_failed(db: Any, analysis: AnalysisModel) -> None:
    analysis.status = "failed"
    analysis.completed_at = datetime.utcnow()
    db.commit()


def _safe(name: str, fn: Callable[..., Any], *args: Any) -> Any:
    """단일 워커 실패가 다른 워커에 전파되지 않도록 (NFR-3.1)."""
    try:
        return fn(*args)
    except Exception:
        logger.exception("%s 워커 실패", name)
        return None


def _extract_audio(video_path: Path, audio_path: Path) -> None:
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(video_path),
            "-vn", "-ac", "1", "-ar", "16000",
            "-f", "wav", str(audio_path),
        ],
        check=True, capture_output=True,
    )


def _video_duration(video_path: Path) -> float:
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(video_path),
            ],
            check=True, capture_output=True, text=True,
        )
        return float(result.stdout.strip())
    except Exception:
        return 0.0


def _run_asr(audio_path: Path, language: str) -> dict[str, Any]:
    from app.workers.asr_worker import transcribe
    return transcribe(audio_path, language)


def _run_vision(video_path: Path) -> dict[str, Any]:
    from app.workers.vision_worker import analyze
    return analyze(video_path)


def _run_audio(
    audio_path: Path, transcript: str | None, duration: float, language: str
) -> dict[str, Any]:
    from app.workers.audio_worker import analyze
    return analyze(audio_path, transcript, duration, language)
