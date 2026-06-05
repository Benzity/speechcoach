"""MediaPipe 비전 분석 — 시선/자세/손 떨림 (FR-4.4 ~ FR-4.7)."""
import logging
from pathlib import Path
from statistics import mean, stdev
from typing import Any

logger = logging.getLogger(__name__)

SAMPLE_FPS = 5  # NFR-1.5
GAZE_LABELS = ("camera", "down", "up", "left", "right")

# iris가 눈 중앙에서 이 비율 이상 벗어나면 시선 이탈로 판정 (발표 기준: 눈 폭의 5%).
# 실제 영상에서 과탐 시 0.10~0.15로 상향 튜닝.
GAZE_OFF_RATIO = 0.05
# 이보다 짧은 이탈 구간은 "주요 감점 요인"에서 제외 (순간적 흔들림).
MIN_GAZE_OFF_SEC = 0.6

# MediaPipe FaceMesh refine_landmarks 인덱스
_L_IRIS, _R_IRIS = 468, 473                   # 좌/우 홍채 중심
_L_EYE_X, _R_EYE_X = (33, 133), (263, 362)    # 좌/우 눈의 좌우 코너
_L_EYE_Y, _R_EYE_Y = (159, 145), (386, 374)   # 좌/우 눈의 위/아래 눈꺼풀


def _eye_ratio(lm, iris_i: int, a_i: int, b_i: int, axis: str) -> float:
    """눈 코너(a,b) 사이에서 홍채의 상대 위치(0~1). 정면이면 ~0.5."""
    iris = getattr(lm.landmark[iris_i], axis)
    a = getattr(lm.landmark[a_i], axis)
    b = getattr(lm.landmark[b_i], axis)
    lo, hi = (a, b) if a <= b else (b, a)
    return (iris - lo) / (hi - lo) if hi > lo else 0.5


def _gaze_direction(lm) -> str:
    """양안 홍채 위치로 시선 방향 판정 (FR-08, iris 기반). camera/down/up/left/right."""
    hx = (_eye_ratio(lm, _L_IRIS, *_L_EYE_X, "x") + _eye_ratio(lm, _R_IRIS, *_R_EYE_X, "x")) / 2
    vy = (_eye_ratio(lm, _L_IRIS, *_L_EYE_Y, "y") + _eye_ratio(lm, _R_IRIS, *_R_EYE_Y, "y")) / 2
    off_x, off_y = hx - 0.5, vy - 0.5
    if abs(off_x) < GAZE_OFF_RATIO and abs(off_y) < GAZE_OFF_RATIO:
        return "camera"
    if abs(off_y) >= abs(off_x):
        return "down" if off_y > 0 else "up"
    return "right" if off_x > 0 else "left"


def _segment_gaze_off(seq: list[tuple[float, str]]) -> list[dict[str, Any]]:
    """시선 방향 시퀀스에서 연속 이탈 구간을 추출 (MIN_GAZE_OFF_SEC 이상만)."""
    events: list[dict[str, Any]] = []
    cur_dir: str | None = None
    cur_start = cur_last = 0.0

    def flush() -> None:
        if cur_dir is not None and cur_last - cur_start >= MIN_GAZE_OFF_SEC:
            events.append(
                {"t": round(cur_start, 1), "dur": round(cur_last - cur_start, 1), "dir": cur_dir}
            )

    for t, d in seq:
        off = d if d in ("down", "up", "left", "right") else None
        if off is not None and off == cur_dir:
            cur_last = t
        else:
            flush()
            cur_dir, cur_start, cur_last = off, t, t
    flush()
    return events


def analyze(video_path: Path) -> dict[str, Any]:
    """영상에서 시선/자세/손 떨림 지표 산출."""
    import cv2  # lazy import
    import mediapipe as mp  # lazy import

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError(f"영상 열기 실패: {video_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_interval = max(1, int(round(fps / SAMPLE_FPS)))

    face_mesh = mp.solutions.face_mesh.FaceMesh(refine_landmarks=True, max_num_faces=1)
    pose = mp.solutions.pose.Pose(model_complexity=1)
    hands = mp.solutions.hands.Hands(max_num_hands=2)

    gaze_counts = dict.fromkeys(GAZE_LABELS, 0)
    gaze_seq: list[tuple[float, str]] = []
    shoulder_diffs: list[float] = []
    spine_scores: list[float] = []
    hand_positions: list[tuple[float, float]] = []
    sampled = 0
    frame_idx = -1

    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_idx += 1
            if frame_idx % frame_interval != 0:
                continue

            sampled += 1
            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

            face_res = face_mesh.process(rgb)
            if face_res.multi_face_landmarks:
                direction = _gaze_direction(face_res.multi_face_landmarks[0])
                gaze_counts[direction] += 1
                gaze_seq.append((frame_idx / fps, direction))

            pose_res = pose.process(rgb)
            if pose_res.pose_landmarks:
                pl = pose_res.pose_landmarks.landmark
                left_sh, right_sh, nose = pl[11], pl[12], pl[0]
                shoulder_diffs.append(abs(left_sh.y - right_sh.y))
                mid_x = (left_sh.x + right_sh.x) / 2
                spine_scores.append(1.0 - min(abs(nose.x - mid_x) * 4, 1.0))

            hands_res = hands.process(rgb)
            if hands_res.multi_hand_landmarks:
                for hand in hands_res.multi_hand_landmarks:
                    wrist = hand.landmark[0]
                    hand_positions.append((wrist.x, wrist.y))
    finally:
        cap.release()
        face_mesh.close()
        pose.close()
        hands.close()

    # 얼굴·자세·손이 모두 한 프레임도 감지되지 않았다면 실질 데이터 없음 → 빈 dict.
    # (전부 0인 5키 dict를 반환하면 _has_vision_data가 "데이터 있음"으로 오판한다.)
    face_frames = sum(gaze_counts.values())
    if face_frames == 0 and not shoulder_diffs and not hand_positions:
        logger.warning(
            "비전 분석: 얼굴·자세·손 모두 미감지 (sampled=%d) — 비언어 데이터 없음 처리", sampled
        )
        return {}

    total = face_frames or 1
    gaze_ratio = {k: v / total for k, v in gaze_counts.items()}

    posture = {
        "shoulder_asymmetry": mean(shoulder_diffs) if shoulder_diffs else None,
        "spine_alignment": mean(spine_scores) if spine_scores else None,
    }

    if len(hand_positions) >= 2:
        xs = [p[0] for p in hand_positions]
        ys = [p[1] for p in hand_positions]
        var = (stdev(xs) if len(xs) > 1 else 0.0) + (stdev(ys) if len(ys) > 1 else 0.0)
        tremor = min(10.0, var * 50)
    else:
        tremor = 0.0

    gaze_off_events = _segment_gaze_off(gaze_seq)

    return {
        "gaze_distribution": gaze_ratio,
        "gaze_off_events": gaze_off_events,
        "posture": posture,
        "hand_tremor_index": tremor,
        "frames_sampled": sampled,
    }
