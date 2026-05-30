"""MediaPipe 비전 분석 — 시선/자세/손 떨림 (FR-4.4 ~ FR-4.7)."""
import logging
from pathlib import Path
from statistics import mean, stdev
from typing import Any

logger = logging.getLogger(__name__)

SAMPLE_FPS = 5  # NFR-1.5
GAZE_LABELS = ("camera", "down", "up", "left", "right")


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
                lm = face_res.multi_face_landmarks[0]
                left_eye = lm.landmark[33]
                right_eye = lm.landmark[263]
                cx = (left_eye.x + right_eye.x) / 2
                cy = (left_eye.y + right_eye.y) / 2
                dx, dy = cx - 0.5, cy - 0.5
                if abs(dx) < 0.05 and abs(dy) < 0.05:
                    gaze_counts["camera"] += 1
                elif abs(dx) > abs(dy):
                    gaze_counts["right" if dx > 0 else "left"] += 1
                else:
                    gaze_counts["down" if dy > 0 else "up"] += 1

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

    return {
        "gaze_distribution": gaze_ratio,
        "posture": posture,
        "hand_tremor_index": tremor,
        "frames_sampled": sampled,
    }
