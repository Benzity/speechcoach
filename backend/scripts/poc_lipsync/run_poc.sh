#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/Wav2Lip"

CKPT="checkpoints/wav2lip_gan.pth"
FACE="../test_assets/test_face.jpg"
AUDIO="../test_assets/test_question.wav"
OUT="../test_assets/test_output.mp4"

[[ -f "$CKPT" ]] || { echo "MISSING: $SCRIPT_DIR/Wav2Lip/checkpoints/wav2lip_gan.pth"; exit 1; }
[[ -f face_detection/detection/sfd/s3fd.pth ]] || { echo "MISSING: $SCRIPT_DIR/Wav2Lip/face_detection/detection/sfd/s3fd.pth"; exit 1; }
[[ -f "$FACE" ]] || { echo "MISSING: $SCRIPT_DIR/test_assets/test_face.jpg (얼굴 정면 사진 1장)"; exit 1; }

time ../.venv-poc/bin/python inference.py \
  --checkpoint_path "$CKPT" \
  --face "$FACE" \
  --audio "$AUDIO" \
  --outfile "$OUT" \
  --resize_factor 1 \
  --pads 0 20 0 0 \
  --wav2lip_batch_size 32 \
  --static True

echo ""
echo "=== 결과 ==="
ls -lh "$OUT"
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$OUT" | xargs -I{} echo "영상 길이: {}초"
echo "재생: open $SCRIPT_DIR/test_assets/test_output.mp4"
