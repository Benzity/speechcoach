# SpeechCoach AI — Backend

SpeechCoach AI v2.0 백엔드 (FastAPI + SQLite + 로컬 GPU 분석 워커).
상세 사양은 프로젝트 루트의 [`SRS.MD`](../SRS.MD) 참조.

## 요구사항

- **Python 3.11** (필수 — mediapipe/faster-whisper wheel 호환). 3.13+ 환경에서는 패키지 설치 실패함.
- NVIDIA GPU + CUDA (faster-whisper GPU 가속용 — 시연 환경: RTX 5070 Ti, Windows)
- ffmpeg (시스템 PATH에 설치 — 영상에서 오디오 추출용)
- Anthropic API Key

## 설치

```bash
cd backend
python3.11 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install --upgrade pip
pip install -r requirements.txt
```

## 환경변수

`.env.example`을 `.env`로 복사한 뒤 값 채워넣기:

```bash
cp .env.example .env
# ANTHROPIC_API_KEY 등 편집
```

## 실행

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API 문서: <http://127.0.0.1:8000/docs>
- 헬스체크: <http://127.0.0.1:8000/health>

## 디렉토리 구조

```
app/
  main.py            FastAPI 엔트리
  api/               라우터 (Phase 2)
  core/              설정·로깅
  db/                SQLAlchemy 모델/세션
  schemas/           Pydantic 스키마
  services/          질문 생성 / 피드백 생성 / PDF 파서
  workers/           ASR / Vision / Audio 분석 워커
data/
  videos/            답변 영상 (질문 단위 저장, .gitignore)
  app.db             SQLite (런타임 생성)
logs/                구조화 로그 (NFR-3.4)
tests/               테스트
```
