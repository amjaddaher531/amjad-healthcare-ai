"""
AGENT 9 — Continuous Learning & Optimization AI

Stores every human correction (approve/reject/modify a code) into a
knowledge base table. This agent NEVER changes official coding rules —
ICD-10-CM / CPT / HCPCS / NCCI / payer policy stay authoritative. It only
surfaces patterns (repeated mistakes, specialty-specific issues) to help
humans and to inform future prompt/context tuning, and produces quality
reports for the AI Performance Dashboard.
"""
from collections import Counter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Correction, Case
from app.models.schemas import CorrectionRecord, QualityReport


async def record_correction(session: AsyncSession, record: CorrectionRecord) -> CorrectionRecord:
    row = Correction(
        case_id=record.case_id,
        code=record.code,
        original_ai_decision=record.original_ai_decision,
        human_correction=record.human_correction,
        reason_for_correction=record.reason_for_correction,
        specialty=record.specialty,
        department=record.department,
        reviewer=record.reviewer,
    )
    session.add(row)
    await session.commit()
    await session.refresh(row)
    record.id = row.id
    record.created_at = row.created_at
    return record


async def build_quality_report(session: AsyncSession) -> QualityReport:
    total_cases = (await session.execute(select(Case))).scalars().all()
    corrections = (await session.execute(select(Correction))).scalars().all()

    total_claims = len(total_cases)
    total_corrections = len(corrections)

    # Accuracy proxy: cases whose codes were never corrected / total cases with corrections tracked
    corrected_case_ids = {c.case_id for c in corrections}
    accuracy = (
        100.0 * (total_claims - len(corrected_case_ids)) / total_claims if total_claims else 100.0
    )

    reason_counter = Counter(c.reason_for_correction.strip().lower() for c in corrections if c.reason_for_correction)
    common_errors = [{"reason": r, "count": n} for r, n in reason_counter.most_common(5)]

    specialty_counter = Counter(c.specialty for c in corrections if c.specialty)
    most_frequent_issues = [{"specialty": s, "corrections": n} for s, n in specialty_counter.most_common(5)]

    manual_review_cases = sum(1 for c in total_cases if c.status == "REQUIRES_MANUAL_REVIEW")
    denial_prediction_rate = 100.0 * manual_review_cases / total_claims if total_claims else 0.0

    return QualityReport(
        total_claims_reviewed=total_claims,
        ai_accuracy_pct=round(accuracy, 1),
        total_human_corrections=total_corrections,
        common_errors=common_errors,
        denial_prediction_rate=round(denial_prediction_rate, 1),
        most_frequent_issues=most_frequent_issues,
    )
