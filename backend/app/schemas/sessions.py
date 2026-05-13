"""요청/응답 Pydantic 스키마. Phase 6에서 결과 응답을 더 다듬을 예정."""
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

SessionStatus = Literal["created", "in_progress", "analyzing", "completed", "failed"]
AnalysisStatusName = Literal["queued", "processing", "completed", "failed"]


class QuestionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    q_index: int
    text: str
    category: str | None = None
    intent: str | None = None


class SessionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    job_title: str
    question_count: int
    status: SessionStatus
    questions: list[QuestionRead]
    created_at: datetime


class AnalysisStatusResponse(BaseModel):
    total: int
    queued: int
    in_progress: int
    completed: int
    failed: int


class AnswerUploadResponse(BaseModel):
    question_id: str
    q_index: int
    status: AnalysisStatusName


class FeedbackTriggerResponse(BaseModel):
    session_id: str
    status: Literal["triggered", "pending", "completed"]


class AnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    question_id: str
    status: AnalysisStatusName
    asr_transcript: str | None = None
    asr_segments_json: str | None = None
    nonverbal_metrics_json: str | None = None
    verbal_metrics_json: str | None = None


class FeedbackRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: str
    llm_response_json: str
    created_at: datetime


class SessionResultResponse(BaseModel):
    session: SessionRead
    analyses: list[AnalysisRead]
    feedback: FeedbackRead | None = None
