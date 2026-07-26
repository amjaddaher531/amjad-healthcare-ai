"""
Human Review Workflow API: coders approve/reject/modify AI code suggestions.
Every modify/reject is recorded via Agent 9 as a correction for the
continuous-learning knowledge base and quality dashboard.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.models.schemas import CorrectionRecord, QualityReport
from app.agents.agent9_learning import record_correction, build_quality_report

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


@router.post("/correction", response_model=CorrectionRecord)
async def submit_correction(record: CorrectionRecord, session: AsyncSession = Depends(get_session)):
    """
    Coder action on a code: reject, modify, or add a comment. `human_correction`
    holds the corrected value (or 'REJECTED' / a free-text comment); official
    coding guideline logic is never altered by this endpoint — it only feeds
    the learning knowledge base.
    """
    return await record_correction(session, record)


@router.get("/quality-report", response_model=QualityReport)
async def quality_report(session: AsyncSession = Depends(get_session)):
    return await build_quality_report(session)
