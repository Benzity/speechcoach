# SpeechCoach AI — 인증 & 면접 히스토리 로드맵

> 목표: 익명 세션 기반인 현재 구조에 **회원가입/로그인**과 **사용자별 면접 히스토리 누적**을 더한다.
> 기존 흐름(세션 생성 → 영상 답변 → 분석 → 피드백)은 그대로 두고, 그 위에 **소유자(User)** 개념만 얹는 방식.

## 전제 (반드시 먼저 읽기)

- **시연용 프로젝트** (소프트웨어공학 과제). 실사용자 없음.
- **백엔드는 Mac mini에서 실행** (ngrok으로 외부 노출 가능성).
- → 보안·확장성·마이그레이션은 *과하게* 신경 쓰지 않는다. **돌아가는 데모 + 깔끔한 코드 흐름**이 우선.

---

## 0. 현황 요약 (변경 전)

| 영역 | 현재 상태 |
|------|----------|
| 백엔드 | FastAPI, SQLAlchemy, SQLite(WAL), `sessions/questions/analyses/feedback` 4개 테이블 |
| 인증 | **없음** — 세션 ID(UUID)만 알면 누구나 결과 조회 가능 |
| 사용자 식별 | **없음** — Session 모델에 `user_id` 컬럼 없음 |
| 프론트 라우팅 | `/`, `/onboarding`, `/interview/:id`, `/processing/:id`, `/result/:id` |
| 프론트 상태 | 인증 컨텍스트 없음, 세션 ID는 URL로만 전달 |

**핵심 변경 포인트**
1. `User` 테이블 신설 + `Session.user_id` FK 추가
2. 비밀번호 해시 + 토큰 발급 (JWT 또는 서버 세션) 도입
3. `/api/sessions` 계열 엔드포인트에 **인증 미들웨어**와 **소유자 검증** 추가
4. 프론트에 `/login`, `/signup`, `/history` 라우트와 AuthContext 추가

---

## 1. 사전 결정 사항 (확정)

| 항목 | 결정 | 비고 |
|------|------|------|
| 인증 토큰 | **JWT access only** (refresh 생략) | TTL 7일 정도로 길게. 시연 중 만료 걱정 없게 |
| 비밀번호 해싱 | `passlib[bcrypt]` | FastAPI 공식 튜토리얼 그대로 |
| 가입 식별자 | 이메일 + 비밀번호 | 비번 길이 4자 이상 정도(시연용) |
| 소셜 로그인 | **제외 (도입 안 함)** | 콜백 URL 등록·도메인 검증 등 비용 과다 |
| 기존 익명 세션 | **폐기** — `Session.user_id`는 **NOT NULL** | `data/speechcoach.db` 삭제 후 재생성. 로그인 안 하면 세션 생성 자체 불가 |
| 비로그인 세션 귀속 | 불필요 (위 결정의 자연스러운 귀결) | |
| DB | SQLite 유지 (WAL) | Mac mini 단일 인스턴스 |

---

## 2. 데이터 모델 변경

### 2.1 신규: `users` 테이블

```python
class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)         # uuid4
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    sessions: Mapped[list["Session"]] = relationship(back_populates="user")
```

### 2.2 수정: `sessions` 테이블

```python
# Session 모델에 추가 — NOT NULL (시연용이라 익명 세션 폐기)
user_id: Mapped[str] = mapped_column(
    String, ForeignKey("users.id"), nullable=False, index=True
)
user: Mapped["User"] = relationship(back_populates="sessions")
```

> **마이그레이션 불필요**: `data/speechcoach.db` 삭제 후 백엔드 재시작이면 끝. Alembic 도입 안 함 (오버엔지니어링).

---

## 3. 백엔드 작업 (Phase별)

### Phase 1 — 인증 코어 (1일)
**목표**: 회원가입/로그인/내정보 조회 동작.

- [ ] `requirements.txt`에 `passlib[bcrypt]`, `python-jose[cryptography]` 추가
- [ ] `app/core/config.py`에 `JWT_SECRET`, `JWT_ALGORITHM="HS256"`, `ACCESS_TTL_DAYS=7` 추가 (env에서 로드, 기본값 없음 → 부팅 실패로 알림)
- [ ] `app/db/models.py`에 `User` 모델 추가, `Session.user_id` FK 추가 (NOT NULL)
- [ ] `app/schemas/auth.py` 신설: `SignupRequest`, `LoginRequest`, `TokenResponse`, `UserRead`
- [ ] `app/services/auth.py` 신설:
  - `hash_password(plain) -> str`
  - `verify_password(plain, hashed) -> bool`
  - `create_access_token(user_id) -> str`
  - `decode_token(token) -> dict`
- [ ] `app/api/auth.py` 신설:
  - `POST /api/auth/signup` → 이메일 중복 검사, 가입 후 토큰 반환
  - `POST /api/auth/login` → 토큰 반환
  - `GET /api/auth/me` → 현재 유저 정보
- [ ] `app/core/deps.py` 신설:
  - `get_current_user(authorization: Header)` 의존성 (Bearer 파싱 + 토큰 검증)
- [ ] `app/main.py`에 `auth_router` 등록

**검증**: `curl`로 가입 → 로그인 → `/me` 호출까지 한 번 돌려본다.

### Phase 2 — 세션 소유권 (반나절)
**목표**: 로그인한 사용자만 세션을 만들 수 있고, 자기 것만 조회 가능.

- [ ] `POST /api/sessions` — `Depends(get_current_user)` 추가, `session_row.user_id = user.id`
- [ ] `GET /api/sessions/{id}`, `analysis-status`, `feedback`, `result`, `video`, `answers/{q}` — 모두 `get_current_user` 의존성 + **`session.user_id != user.id`면 404(403보다 정보 노출 적음)**
- [ ] 익명 호출은 401 반환

**검증**:
- A 유저가 만든 세션을 B 유저 토큰으로 GET → 404
- 토큰 없이 호출 → 401

### Phase 3 — 히스토리 API (반나절)
**목표**: 마이페이지에서 과거 면접 목록 + 점수 요약 조회.

- [ ] `GET /api/me/sessions` 신설
  - 쿼리: `limit` (기본 20), `offset`, `status` 필터 (옵션)
  - 응답: `[{ id, job_title, question_count, status, created_at, overall_score }]`
  - `overall_score`는 `feedback.llm_response_json`의 `scores.overall` 추출 (없으면 null)
- [ ] (옵션) `DELETE /api/sessions/{id}` — 자기 세션 삭제 (영상 파일 + DB row)

**검증**: 같은 유저로 세션 3개 만들고 `/api/me/sessions`가 3개 반환.

### Phase 4 — 시연 마감
- [ ] `User.email` 유니크 위반 시 400 명확한 에러 ("이미 가입된 이메일입니다")
- [ ] 비밀번호 정책: **4자 이상** (시연용. 데모 계정 만들기 편하게)
- [ ] Rate limit, 비번 재설정, 이메일 인증 등 — **전부 스킵**
- [ ] CORS `allow_credentials=False` 유지 (JWT 헤더 방식)

---

## 4. 프론트엔드 작업

### Phase 1 — Auth 인프라
- [ ] `src/auth/AuthContext.tsx`: `user`, `token`, `login()`, `signup()`, `logout()`
  - 토큰은 **localStorage**에 저장 (시연용이라 XSS 걱정 사실상 불필요)
- [ ] `src/api.ts`의 fetch helper에 `Authorization: Bearer ${token}` 자동 부착
- [ ] 401 응답 시 토큰 삭제 + `/login` 리다이렉트 (refresh 로직 없음)

### Phase 2 — 라우트 추가
- [ ] `/signup`, `/login`, `/history` 페이지 추가
- [ ] `<ProtectedRoute>` 래퍼: 미로그인 시 `/login`으로
- [ ] `StartPage`에서 "면접 시작" 누르면 로그인 강제

### Phase 3 — 히스토리 페이지
- [ ] 카드 리스트: 직무 / 생성일 / 상태 배지 / overall_score
- [ ] 카드 클릭 → `/result/:id`로 이동 (이미 존재하는 결과 페이지 재사용)
- [ ] 빈 상태 메시지

### Phase 4 — UX 마감
- [ ] 헤더에 로그인 상태 표시 + 로그아웃 버튼
- [ ] 로그인 폼 에러 메시지(이메일 형식, 비번 길이, 401 분기)
- [ ] 토큰 만료 시 자연스럽게 재로그인 유도

---

## 5. 보안 체크리스트 (시연용 최소선)

- [ ] `JWT_SECRET`은 `.env`로만 주입, 기본값 금지 (없으면 부팅 실패 → 실수 방지)
- [ ] `UserRead` 스키마에 `password_hash` 포함 금지
- [ ] 영상 스트리밍 엔드포인트도 인증 + 소유자 검증 (현재 누구나 접근 가능 — 가장 큰 노출 지점)
- [ ] 로그에 토큰/비밀번호 평문 금지

> 시연용이라 **HTTPS 강제, 비번 강도, rate limit, 토큰 회전 등은 의도적으로 제외**. 발표 시 "운영 시 추가할 항목"으로 언급만 해도 충분.

---

## 6. 마일스톤 (시연 기준 일정)

```
D+1  : Phase 1 백엔드 — auth API + User 모델 + Session.user_id FK
D+2  : Phase 2 백엔드 — 기존 엔드포인트 전부 인증 적용 + 영상 엔드포인트 보호
D+3  : Phase 1~2 프론트 — AuthContext + /login, /signup 페이지
D+4  : Phase 3 양쪽 — /api/me/sessions + /history 페이지
D+5  : Phase 4 마감 — 헤더 로그인 표시, 회귀 테스트, 시연 시나리오 1회 끝까지 돌려보기
```

---

## 7. Mac mini 호스팅 운영 메모

시연 환경의 특수성 때문에 결정·체크해야 할 것들. 이게 인증 로드맵의 절반 정도 중요도.

### 7.1 프론트를 어디서 서빙할지 — **결정: 옵션 A (Mac mini 통합 서빙)**

현재는 `netlify.toml`로 보아 **프론트=Netlify, 백엔드=Mac mini(ngrok)**의 분리 구조다. 시연 관점에서 이건 부담이 크다. → **Mac mini 한 곳에서 다 서빙으로 전환.**

#### 옵션 A — **Mac mini 한 곳에서 다 서빙 (채택)**

FastAPI에 정적 파일 마운트만 추가하면 끝.

```python
# app/main.py 끝부분에 추가
from fastapi.staticfiles import StaticFiles
from pathlib import Path

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIST, html=True), name="frontend")
```

- **장점**
  - ngrok URL 하나만 외부에 노출 → 시연 환경 변수 동기화 이슈 **완전 소멸**
  - `VITE_API_BASE`를 비워두면 프론트가 같은 origin의 `/api/...`로 호출 → CORS 설정도 불필요 (`CORS_ORIGINS` 신경 끄기)
  - 백엔드 재시작 한 번에 모든 게 같이 살아남
- **단점**
  - 프론트 코드 바꿀 때마다 `cd frontend && npm run build` 필요 (개발 중에는 여전히 Vite dev 서버 쓰면 됨, 시연 직전에만 빌드)
- **SPA 라우팅**: `html=True` 옵션이 미존재 경로를 `index.html`로 떨궈줌 → 새로고침 시 404 안 남 (현재 `netlify.toml`의 redirect 규칙과 동일 효과)

#### 옵션 B — 현재 구조 유지 (Netlify + Mac mini)

- ngrok URL 바뀔 때마다:
  1. Netlify 환경변수에서 `VITE_API_BASE` 갱신
  2. 재배포 트리거 (Git push 또는 Netlify UI "Clear cache and deploy")
  3. 백엔드 `CORS_ORIGINS`에 Netlify 도메인 들어있는지 확인
- 시연 직전에 ngrok이 재시작되면 위 절차를 5분 안에 끝내야 함. 발표 직전 스트레스 요인.

**권고**: 옵션 A. 옵션 B의 장점(Netlify CDN, 빌드 자동화)이 시연용에선 의미 없음.

### 7.2 ngrok 도메인 — **이미 고정 도메인 사용 중**

확인 결과 ngrok 무료 플랜의 **정적 도메인(`entail-imagines-blah.ngrok-free.dev`)을 이미 쓰고 있음** (`ngrok http --url=...` 형태). 무료 플랜은 정적 도메인 1개를 무료로 제공.

→ **URL 변동 문제 자체가 없음.** 발표 직전 ngrok 재시작해도 같은 도메인 그대로.

**유지해야 할 것**
- 시연 당일에도 같은 명령으로 ngrok 띄우기 (랜덤 도메인 받지 않도록 `--url=` 옵션 빠뜨리지 말 것)
- ngrok 계정에 로그인된 상태 유지 (정적 도메인은 계정 귀속)

**모르고 ngrok 끊겼다면 복구 명령**
```bash
ngrok http --url=entail-imagines-blah.ngrok-free.dev 8002 --log=stdout --log-format=logfmt
```

> 옵션 A(통합 서빙) + 고정 도메인 조합 → **시연 환경의 가장 큰 사고 위험은 사실상 0**. 남은 위험은 Mac mini 자체가 다운되거나 인터넷 회선이 끊기는 경우뿐.

### 7.3 데이터 리셋 절차

발표 시작 전 깨끗한 상태로 만들 때:

```bash
cd /Users/benzity/Documents/DEV/auto/speechcoach/backend

# 1. 백엔드 중지 (이미 떠 있다면)
# 2. DB + WAL 곁가지 파일까지 전부 제거
rm -f data/app.db data/app.db-shm data/app.db-wal

# 3. 영상 디렉토리 비우기 (디렉토리 자체는 유지)
rm -rf data/videos/*

# 4. 백엔드 재시작 → lifespan에서 Base.metadata.create_all 자동 실행
uvicorn app.main:app --host 0.0.0.0 --port 8002
```

> WAL 모드라 `.db-shm`, `.db-wal` 파일도 같이 지워야 함. 이걸 빼먹으면 이전 트랜잭션이 재구성되면서 데이터가 부분적으로 살아난다.

### 7.4 시연용 시드 스크립트

Phase 4에 추가할 `backend/scripts/seed_demo.py`. 발표 직전 한 방에 데모 상태 만들기:

```python
# scripts/seed_demo.py
"""시연용 더미 계정 + 완료된 세션 1개 시드."""
from app.db.database import SessionLocal, Base, engine
from app.db.models import User, Session as S, Question, Analysis, Feedback
from app.services.auth import hash_password
import json, uuid

Base.metadata.create_all(bind=engine)
db = SessionLocal()

user = User(id=str(uuid.uuid4()), email="demo@test.com",
            password_hash=hash_password("1234"), display_name="데모")
db.add(user)
# ... 완료된 세션 + 더미 피드백 JSON 1개 삽입
db.commit()
print(f"demo user id = {user.id}")
```

발표 흐름:
1. `/login`에서 `demo@test.com` / `1234`로 로그인 (회원가입 화면도 보여줄 수 있음)
2. `/history`에서 과거 면접 1건 클릭 → 결과 페이지 표시
3. 새 면접 시작 → 실제 녹화 시연

### 7.5 시연 당일 체크리스트 — **현재 상태 점검 결과**

발표 30분 전 다시 한 번 돌릴 항목들. ✅ 표시는 현재(작성 시점) 이미 OK, ⚠️는 시연 전 처리 필요.

- ✅ Mac mini sleep 사실상 비활성 (`pmset -g` 확인 — `sleep 1`이지만 powerd 등이 prevent 중, `displaysleep 0` 무한). 더 확실히 하려면 시연 직전 `caffeinate -dimsu &` 한 줄 실행
- ⚠️ `.env`에 **`JWT_SECRET` 추가 필요** (현재는 `ANTHROPIC_API_KEY`, `PORT`만 있음). Phase 1 구현 시점에 같이.
  - 생성: `python -c "import secrets; print(secrets.token_urlsafe(64))"` → `.env`에 `JWT_SECRET=...`
- ✅ 백엔드 정상 기동 — `curl http://localhost:8002/health` → `{"status":"ok"}` 확인됨
- ⚠️ `data/app.db` **현재 sessions 14건, videos 5세션 누적**. 시연 직전 7.3 절차로 리셋
- ⚠️ `frontend/dist`는 5/14자 빌드. auth UI 추가 후 `cd frontend && npm run build` 새로
- ✅ ngrok 정적 도메인 가동 중 (`entail-imagines-blah.ngrok-free.dev`)
- ✅ ngrok 터널 외부 도달 확인 — `https://entail-imagines-blah.ngrok-free.dev/health` HTTP 200
- ⏸️ 노트북(별도 기기)에서 위 URL 접속 → 로그인 → 면접 1회 끝까지 — **시연 직전 직접**
- ⏸️ 카메라/마이크 권한 — Chrome에서 ngrok 도메인 처음 방문 시 권한 팝업. 미리 허용해두기
- ⏸️ 인터넷 회선 백업 — 발표장 와이파이가 ngrok 도메인 차단 사례 있음. 테더링 한 번 미리 테스트

### 7.6 ngrok 보안 — **신경 써서 관리**

정적 도메인이라 더더욱 한 번 유출되면 계속 그 주소가 인터넷에 떠 있다는 의미. 무료 시연용이라도 다음은 지킬 것:

**발표 전**
- ngrok URL을 **GitHub README, 슬라이드, 소셜 미디어에 박지 말 것** — 봇이 정기적으로 ngrok-free.dev 도메인을 스캔함
- `.env`, `*.env*` 파일이 `.gitignore`에 있는지 확인 (`JWT_SECRET`, `ANTHROPIC_API_KEY` 유출 방지)
- 영상 스트리밍 엔드포인트(`/api/sessions/{id}/answers/{q}/video`)는 **현재 인증 없음** — 세션 UUID만 알면 누구나 본인 면접 영상 다운로드 가능. **Phase 2에서 반드시 인증 적용**
- `data/` 안에 본인 실제 이력서(PDF)가 있다면 발표 전 정리

**발표 중**
- ngrok 대시보드(`http://localhost:4040`)에서 트래픽 실시간 모니터링 — 모르는 IP에서 호출 들어오면 즉시 인지 가능
- 시연용 더미 계정만 사용. 본인 실제 계정 생성/로그인은 시연 후로

**발표 후**
- `Ctrl+C`로 ngrok 종료. 자동 재시작 스크립트가 있다면 비활성화
- `data/app.db`에 시연 도중 들어온 외부 데이터가 있는지 확인 → 있으면 삭제
- `data/videos/` 정리

**상시**
- ngrok 계정 비번 안전하게 (정적 도메인은 계정 종속이라 계정 탈취 = 도메인 탈취)
- 이상 트래픽이 의심되면 ngrok 대시보드에서 도메인 회수 후 재발급

---

**요약**: 7.1의 옵션 A(통합 서빙)만 채택해도 7.2~7.5의 절반은 자동으로 풀린다. 시연이 한 번이라면 이게 압도적으로 합리적.
