"""librosa 기반 오디오 분석 (FR-4.8, FR-4.10, FR-4.11)."""
import logging
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# "긴 침묵"으로 카운트할 최소 무음 구간 길이(초). 0.5초는 정상 발화 사이의
# 호흡/쉼표 수준이라 과다 보고를 유발 → 면접에서 불편하게 느껴지는 정적 기준인 1.5초로 상향.
LONG_SILENCE_SEC = 1.5


def analyze(audio_path: Path, transcript: str | None, duration_sec: float) -> dict[str, Any]:
    """피치/속도/침묵/RMS 지표 산출."""
    import librosa  # lazy import
    import numpy as np  # lazy import

    y, sr = librosa.load(str(audio_path), sr=16000)

    f0, _voiced, _ = librosa.pyin(
        y, fmin=librosa.note_to_hz("C2"), fmax=librosa.note_to_hz("C7")
    )
    voiced = f0[~np.isnan(f0)] if f0 is not None else np.array([])
    pitch_mean = float(np.mean(voiced)) if voiced.size else None
    pitch_std = float(np.std(voiced)) if voiced.size else None
    monotone = (pitch_std / pitch_mean) if (pitch_mean and pitch_std) else None

    rms = librosa.feature.rms(y=y)[0]
    rms_mean = float(np.mean(rms))

    intervals = librosa.effects.split(y, top_db=30)
    voiced_dur = sum((e - s) for s, e in intervals) / sr if len(intervals) else 0.0
    silence_dur = max(0.0, duration_sec - voiced_dur)

    long_silences = 0
    if len(intervals) >= 2:
        for i in range(len(intervals) - 1):
            gap = (intervals[i + 1][0] - intervals[i][1]) / sr
            if gap >= LONG_SILENCE_SEC:
                long_silences += 1

    wpm = None
    if transcript and voiced_dur > 0:
        words = transcript.split()
        wpm = (len(words) / voiced_dur) * 60

    return {
        "pitch_mean": pitch_mean,
        "pitch_std": pitch_std,
        "monotone_index": monotone,
        "rms_mean": rms_mean,
        "voiced_duration_sec": voiced_dur,
        "silence_duration_sec": silence_dur,
        "long_silences_count": long_silences,
        "wpm": wpm,
    }
