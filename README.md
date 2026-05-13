# SpeechCoach AI v2.0

웹 기반 AI 모의면접 & 비언어/반언어 분석 시스템. 1인 개발 시연용 (브라우저 + 로컬 GPU 서버).

상세 사양은 [`SRS.MD`](./SRS.MD).

## 핵심 아키텍처

**질문 단위 비동기 파이프라인** — 각 질문 답변 종료 시점에 영상을 즉시 서버로 업로드하고
백그라운드에서 분석을 시작한다. 클라이언트는 업로드 완료를 기다리지 않고 다음 질문으로
진행한다. 세션 종료 후 누적 분석을 Claude API에 전달해 종합 피드백을 생성한다.

```
[온보딩] → [Claude: 질문 N개 일괄 생성] → [면접 N회 반복]
                                              ├─ 영상 즉시 업로드
                                              └─ 백그라운드 분석(ASR/Vision/Audio)
       → [모든 분석 폴링] → [Claude: 종합 피드백] → [결과 페이지]
```

## 구성

| 영역 | 스택 |
|---|---|
| 백엔드 | FastAPI + SQLAlchemy(SQLite + WAL) + ThreadPoolExecutor(max_workers=1) |
| 분석 | faster-whisper(large-v3, CUDA) / MediaPipe(Face/Pose/Hands) / librosa |
| LLM | Anthropic Claude (sonnet-4) — **세션당 정확히 2회 호출** |
| 프론트엔드 | Vite + React + TypeScript + Tailwind v4 + Recharts + React Router v6 |
| 영상 포맷 | WebM (MediaRecorder 기본 출력, 서버 변환 없음) |

## 시연 환경 요구사항

| 항목 | 권장 |
|---|---|
| OS | Windows 10/11 (RTX 5070 Ti 시연 환경) |
| Python | **3.11** (mediapipe/faster-whisper wheel 호환) |
| Node | 20+ |
| GPU | NVIDIA RTX 5070 Ti, 16GB VRAM, CUDA 활성 |
| ffmpeg | 시스템 PATH 등록 |
| 브라우저 | Chrome/Edge 최신 (HTTPS 또는 localhost — 카메라 권한 요건) |

## 시작 (시연 환경 초기 셋업)

```bash
# 1) 백엔드 셋업
cd backend
python3.11 -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
pip install --upgrade pip
pip install -r requirements.txt

# 2) 환경변수
cp .env.example .env
# .env 편집:
#   ANTHROPIC_API_KEY=sk-ant-...
#   (선택) CLAUDE_MODEL, WHISPER_MODEL, WHISPER_DEVICE 등

# 3) 백엔드 실행 (포트 8000)
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```bash
# 4) 프론트엔드 셋업 (다른 터미널)
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

- Swagger UI: <http://127.0.0.1:8000/docs>
- 로그: `backend/logs/app.log` (일별 로테이션, 7일 보관)

## 시연 직전·직후 정리

```bash
cd backend
.venv/bin/python scripts/cleanup.py
# 또는 --yes 로 확인 생략
.venv/bin/python scripts/cleanup.py --yes
```

영상 디렉토리(`data/videos/<session>/`)와 SQLite(`data/app.db`, WAL/SHM 포함)를 삭제한다.

## 시연 주의사항

- 카메라·마이크 권한은 **HTTPS 또는 localhost**에서만 허용됨. IP 주소 접속(예: `http://192.168.x.x`)은 차단됨.
- Whisper 첫 호출 시 모델 로드(수십 초)가 한 번 발생. 시연 직전 가벼운 영상 1개로 워밍업 권장.
- 영상 1개당 분석 30~90초 (NFR-1.3). 질문 5개 면접이면 마지막 답변 후 대기 30~60초로 수렴.
- Claude API 호출은 세션당 2회 — 질문 생성, 종합 피드백. 그 외 외부 호출 없음.

## 라이선스 / 비공개 데이터

- `backend/.env`, `backend/data/`, `backend/logs/`는 모두 `.gitignore` 처리됨.
- `ANTHROPIC_API_KEY`는 환경변수로만 주입되며 프론트엔드에 노출되지 않음 (NFR-5.2).
- 시연 후 `scripts/cleanup.py`로 영상·DB 삭제 권장 (NFR-5.4).
