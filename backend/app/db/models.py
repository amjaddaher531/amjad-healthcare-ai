"""
Persistence models:
- Case: one uploaded-document-set analysis run, storing the full pipeline
  result as JSON for later retrieval / re-render.
- Correction: a human coder's correction to an AI decision (Agent 9's
  knowledge base), used for quality reporting and future prompt tuning.
"""
from datetime import datetime
from sqlalchemy import String, Text, DateTime, JSON, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    status: Mapped[str] = mapped_column(String(32), default="PROCESSING")
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0)
    result_json: Mapped[str] = mapped_column(Text)  # full PipelineResult as JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Correction(Base):
    __tablename__ = "corrections"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    case_id: Mapped[str] = mapped_column(String(16), index=True)
    code: Mapped[str] = mapped_column(String(32))
    original_ai_decision: Mapped[str] = mapped_column(Text)
    human_correction: Mapped[str] = mapped_column(Text)
    reason_for_correction: Mapped[str] = mapped_column(Text)
    specialty: Mapped[str] = mapped_column(String(128), nullable=True)
    department: Mapped[str] = mapped_column(String(128), nullable=True)
    reviewer: Mapped[str] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
