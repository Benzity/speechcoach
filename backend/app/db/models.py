"""SRS 5.2 데이터 모델 — sessions / questions / analyses / feedback."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    job_title: Mapped[str] = mapped_column(String, nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    # 'created' | 'in_progress' | 'analyzing' | 'completed' | 'failed'
    status: Mapped[str] = mapped_column(String, nullable=False, default="created")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    questions: Mapped[list["Question"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", order_by="Question.q_index"
    )
    feedback: Mapped["Feedback | None"] = relationship(
        back_populates="session", uselist=False, cascade="all, delete-orphan"
    )


class Question(Base):
    __tablename__ = "questions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    session_id: Mapped[str] = mapped_column(String, ForeignKey("sessions.id"), nullable=False)
    q_index: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String, nullable=True)
    intent: Mapped[str | None] = mapped_column(String, nullable=True)

    session: Mapped[Session] = relationship(back_populates="questions")
    analysis: Mapped["Analysis | None"] = relationship(
        back_populates="question", uselist=False, cascade="all, delete-orphan"
    )


class Analysis(Base):
    __tablename__ = "analyses"

    question_id: Mapped[str] = mapped_column(
        String, ForeignKey("questions.id"), primary_key=True
    )
    video_path: Mapped[str | None] = mapped_column(String, nullable=True)
    asr_transcript: Mapped[str | None] = mapped_column(Text, nullable=True)
    asr_segments_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    nonverbal_metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    verbal_metrics_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    # 'queued' | 'processing' | 'completed' | 'failed'
    status: Mapped[str] = mapped_column(String, nullable=False, default="queued")
    started_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    question: Mapped[Question] = relationship(back_populates="analysis")


class Feedback(Base):
    __tablename__ = "feedback"

    session_id: Mapped[str] = mapped_column(
        String, ForeignKey("sessions.id"), primary_key=True
    )
    llm_response_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped[Session] = relationship(back_populates="feedback")
