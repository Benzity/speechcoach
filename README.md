# SpeechCoach AI v2.0

웹 기반 AI 모의면접 & 비언어/반언어 분석 시스템. 1인 개발 시연용 (브라우저 + 로컬 GPU 서버).

상세 사양은 [`SRS.MD`](./SRS.MD) 참조.

## 핵심 아키텍처

**질문 단위 비동기 파이프라인** — 각 질문 답변 종료 시점에 영상을 즉시 서버로 업로드하고
백그라운드에서 분석을 시작한다. 클라이언트는 업로드 완료를 기다리지 않고 다음 질문으로
진행한다. 세션 종료 후 누적 분석을 Claude API에 전달해 종합 피드백을 생성한다.

## 구성

| 영역 | 스택 |
|---|---|
| 백엔드 | FastAPI + SQLAlchemy(SQLite + WAL) + ThreadPoolExecutor |
| 분석 | faster-whisper (large-v3, CUDA) / MediaPipe / librosa |
| LLM | Anthropic Claude (sonnet-4) — 세션당 2회 호출 (질문 생성 + 종합 피드백) |
| 프론트엔드 | Vite + React + TypeScript + Tailwind + Recharts |
| 영상 포맷 | WebM (브라우저 MediaRecorder 기본 출력, 변환 없음) |

## 시작

각 디렉토리의 README 참조:

- 백엔드: [`backend/README.md`](./backend/README.md)
- 프론트엔드: `frontend/README.md` (Vite 기본 — Phase 1 init 결과)

## 운영 환경

- 서버: Windows 10/11, Python 3.11, NVIDIA RTX 5070 Ti (CUDA), RAM 16GB+
- 클라이언트: Chrome/Edge 최신, HTTPS 또는 localhost (카메라 권한 요건)
