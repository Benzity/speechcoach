from fastapi import FastAPI

app = FastAPI(title="SpeechCoach AI", version="2.0.0")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# TODO(Phase 2): SRS 4.3.2의 7개 엔드포인트 라우터를 app.include_router()로 등록
