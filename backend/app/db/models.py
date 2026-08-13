"""SRS 5.2 데이터 모델 — users / sessions / questions / analyses / feedback."""
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    display_name: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    # 발급된 JWT를 서버 측에서 무효화하기 위한 세대 번호.
    # 로그아웃·비밀번호 변경·탈퇴 시 증가시키면 이전 토큰이 즉시 죽는다.
    # (JWT는 그 자체로 취소가 불가능하므로 이런 우회 장치가 필요하다.)
    token_version: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # 개인정보 수집·이용 동의 이력 (제15조·제22조).
    consented_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    consent_version: Mapped[str | None] = mapped_column(String, nullable=True)
    # 국외이전 동의는 별도 항목이어야 한다 (제28조의8).
    overseas_consented_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    # 만 14세 이상임을 확인한 시각 (제22조의2).
    # 생년월일 자체는 저장하지 않는다 — 확인 목적을 넘는 수집이기 때문(제16조).
    age_verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    sessions: Mapped[list["Session"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id"), nullable=False, index=True
    )
    job_title: Mapped[str] = mapped_column(String, nullable=False)
    resume_text: Mapped[str] = mapped_column(Text, nullable=False)
    ideal_profile: Mapped[str | None] = mapped_column(Text, nullable=True)
    question_count: Mapped[int] = mapped_column(Integer, nullable=False)
    # 'created' | 'in_progress' | 'analyzing' | 'completed' | 'failed'
    status: Mapped[str] = mapped_column(String, nullable=False, default="created")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user: Mapped["User"] = relationship(back_populates="sessions")
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
