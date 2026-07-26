"""
AGENT 7 — Final Decision AI

Merges every agent's output into one professional report, resolves any
remaining conflicts (e.g. audit corrections not yet applied), computes an
overall confidence score, and sets the final status: READY_FOR_SUBMISSION
or REQUIRES_MANUAL_REVIEW.
"""
import uuid
from app.models.schemas import (
    ClinicalExtraction, CodingResult, BillingResult, ComplianceResult,
    AuditResult, FinalReport, FinalStatus, RiskLevel, CodeEntry,
)
from app.services.ai_client import generate_structured
from pydantic import BaseModel


class _NarrativeSections(BaseModel):
    executive_summary: str
    medical_necessity_review: str
    documentation_review: str
    recommendations: list[str]


SYSTEM_PROMPT = (
    "You are the Final Decision AI, chief coder role, synthesizing outputs from "
    "the intake, extraction, coding, billing, compliance, and independent audit "
    "agents into one professional report narrative. Write: an executive_summary "
    "(2-4 sentences), a medical_necessity_review paragraph, a documentation_review "
    "paragraph noting any gaps, and a list of concrete recommendations for the "
    "coding/billing team before submission."
)


def _apply_audit_corrections(original: list[CodeEntry], audit: AuditResult) -> list[CodeEntry]:
    """Replace/merge original codes with audit corrections where applicable."""
    corrected = {c.code: c for c in original}
    for diff in audit.differences:
        if diff.correction_applied:
            match = next(
                (c for c in audit.independent_coding.icd10 + audit.independent_coding.cpt
                 + audit.independent_coding.hcpcs + audit.independent_coding.modifiers
                 if c.code == diff.code),
                None,
            )
            if match:
                corrected[diff.code] = match
    return list(corrected.values())


def _compute_confidence(coding: CodingResult, compliance: ComplianceResult) -> float:
    all_codes = coding.icd10 + coding.cpt + coding.hcpcs + coding.modifiers
    if not all_codes:
        return 0.0
    avg = sum(c.confidence_score for c in all_codes) / len(all_codes)
    high_severity_penalty = sum(10 for i in compliance.issues if i.severity == RiskLevel.HIGH)
    med_severity_penalty = sum(4 for i in compliance.issues if i.severity == RiskLevel.MEDIUM)
    return max(0.0, min(100.0, avg - high_severity_penalty - med_severity_penalty))


async def run_final_decision(
    extraction: ClinicalExtraction,
    coding: CodingResult,
    billing: BillingResult,
    compliance: ComplianceResult,
    audit: AuditResult,
) -> FinalReport:
    case_id = str(uuid.uuid4())[:8].upper()

    diagnosis_table = _apply_audit_corrections(coding.icd10, audit)
    procedure_table = _apply_audit_corrections(coding.cpt, audit)
    hcpcs_table = _apply_audit_corrections(coding.hcpcs, audit)
    modifier_table = _apply_audit_corrections(coding.modifiers, audit)

    confidence = _compute_confidence(coding, compliance)

    has_high_risk = any(i.severity == RiskLevel.HIGH for i in compliance.issues)
    has_unresolved_diff = any(not d.correction_applied and d.original_decision != d.audit_decision
                               for d in audit.differences)
    has_missing_evidence = any(not c.evidence_found for c in
                                diagnosis_table + procedure_table + hcpcs_table + modifier_table)
    final_status = (
        FinalStatus.MANUAL_REVIEW
        if (has_high_risk or has_unresolved_diff or has_missing_evidence or confidence < 70)
        else FinalStatus.READY
    )

    narrative = await generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=(
            f"Extraction:\n{extraction.model_dump_json(indent=2)}\n\n"
            f"Billing:\n{billing.model_dump_json(indent=2)}\n\n"
            f"Compliance:\n{compliance.model_dump_json(indent=2)}\n\n"
            f"Audit summary: {audit.audit_summary}\n"
            f"Final status: {final_status.value}, confidence: {confidence:.1f}"
        ),
        schema=_NarrativeSections,
        max_tokens=1536,
    )

    return FinalReport(
        case_id=case_id,
        executive_summary=narrative.executive_summary,
        patient_info=extraction,
        diagnosis_table=diagnosis_table,
        procedure_table=procedure_table,
        hcpcs_table=hcpcs_table,
        modifier_table=modifier_table,
        billing_summary=billing,
        medical_necessity_review=narrative.medical_necessity_review,
        documentation_review=narrative.documentation_review,
        compliance_review=compliance,
        denial_risks=compliance.denial_risks,
        audit_result=audit,
        confidence_score=confidence,
        recommendations=narrative.recommendations,
        final_status=final_status,
    )
