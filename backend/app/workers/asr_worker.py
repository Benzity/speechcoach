"""faster-whisper(CUDA) 기반 ASR (FR-4.3)."""
import logging
from pathlib import Path
from typing import Any

from app.core.config import WHISPER_COMPUTE_TYPE, WHISPER_DEVICE, WHISPER_MODEL

logger = logging.getLogger(__name__)

_model: Any = None


def _load_model() -> Any:
    global _model
    if _model is None:
        from faster_whisper import WhisperModel  # lazy import

        logger.info(
            "Whisper 로드 model=%s device=%s compute=%s",
            WHISPER_MODEL, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE,
        )
        _model = WhisperModel(
            WHISPER_MODEL, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE
        )
    return _model


def transcribe(audio_path: Path) -> dict[str, Any]:
    """오디오 파일을 전사. 반환: {transcript, segments, duration}."""
    model = _load_model()
    segments, info = model.transcribe(str(audio_path), language="ko", beam_size=1)
    segs: list[dict[str, Any]] = []
    parts: list[str] = []
    for s in segments:
        segs.append({"start": s.start, "end": s.end, "text": s.text})
        parts.append(s.text)
    return {
        "transcript": " ".join(p.strip() for p in parts).strip(),
        "segments": segs,
        "duration": float(info.duration),
    }
