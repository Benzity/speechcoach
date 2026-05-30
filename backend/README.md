# SpeechCoach AI — Backend

FastAPI + SQLite + 로컬 GPU 분석 워커. 상세 사양은 [`../SRS.MD`](../SRS.MD).

## 요구사항

- **Python 3.12** (mediapipe `<0.10.30` / faster-whisper wheel 호환 — 3.13+ wheel 부재)
- NVIDIA GPU + CUDA (RTX 5070 Ti, 16GB VRAM 권장)
- ffmpeg (시스템 PATH)
- Anthropic API Key

## 설치

```bash
python3.12 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 환경변수 (`.env`)

```
ANTHROPIC_API_KEY=sk-ant-...
CLAUDE_MODEL=claude-sonnet-4-20250514

HOST=127.0.0.1
PORT=8000
VIDEO_DIR=./data/videos
DB_PATH=./data/app.db

WHISPER_MODEL=large-v3
WHISPER_COMPUTE_TYPE=float16
WHISPER_DEVICE=cuda
```

## 실행

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API 문서: <http://127.0.0.1:8000/docs>
- 헬스체크: <http://127.0.0.1:8000/health>
- 로그: `logs/app.log` (DEBUG+, 일별 로테이션, 7일 보관). 콘솔은 INFO+.

## 디렉토리 구조

```
app/
  main.py              FastAPI 엔트리 + lifespan create_all
  core/
    config.py          환경변수 로드
    logging.py         dictConfig (콘솔 INFO + 파일 DEBUG)
  api/sessions.py      SRS 4.3.2의 7개 엔드포인트
  db/
    database.py        engine/SessionLocal/Base/get_db (WAL + foreign_keys ON)
    models.py          sessions / questions / analyses / feedback
  schemas/sessions.py  요청·응답 Pydantic
  services/
    question_generator.py    Claude API: N개 질문 생성 (1차 호출)
    feedback_generator.py    Claude API: 종합 피드백 (2차 호출)
    resume_parser.py         pdfplumber PDF → 텍스트
    filler_detector.py       한/영 필러워드 46종 + 버벅거림
  workers/
    queue.py             ThreadPoolExecutor(max_workers=1, GPU 직렬화)
    pipeline.py          ASR + Vision + Audio 오케스트레이션 + DB write
    asr_worker.py        faster-whisper (lazy import, GPU)
    vision_worker.py     MediaPipe Face/Pose/Hands (5 FPS 샘플)
    audio_worker.py      librosa 피치/RMS/침묵/WPM
data/
  videos/<session>/<q_index>.webm     답변 영상
  app.db                              SQLite (런타임 생성)
logs/                                 일별 로그
scripts/cleanup.py                    영상·DB 일괄 삭제
tests/                                테스트 (현재 비어있음)
```

## 정리 스크립트

```bash
.venv/bin/python scripts/cleanup.py        # 확인 후 삭제
.venv/bin/python scripts/cleanup.py --yes  # 확인 생략
```

## 주요 흐름

1. `POST /api/sessions` — 직무·이력서·N → Claude로 N개 질문 사전 생성 → 세션·질문 저장
2. `POST /api/sessions/{id}/answers/{q_index}` — 영상 디스크 저장 + `analyses` 레코드 `queued` + 큐 등록 → **즉시 202**
3. (백그라운드) `pipeline.run_analysis_for_question`:
   - ffmpeg 오디오 추출 → ASR(GPU 직렬) → Vision/Audio 병렬(ThreadPool×2) → DB 저장
   - 단일 워커 실패는 격리되어 나머지 결과 살림 (NFR-3.1)
4. `GET /api/sessions/{id}/analysis-status` — 진행률 폴링
5. `POST /api/sessions/{id}/feedback` — 모든 분석 완료 확인 → Claude로 종합 피드백 → 저장 (idempotent)
6. `GET /api/sessions/{id}/result` — 세션+질문+분석+피드백 한 번에
7. `GET /api/sessions/{id}/answers/{q_index}/video` — `FileResponse`로 스트리밍 (Range 자동 지원)
