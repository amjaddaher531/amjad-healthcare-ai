"""
Orchestrator: runs the full 9-agent pipeline in order, emitting timeline
events as it goes (for the frontend's Agent Activity Timeline, delivered
either via the returned list or streamed over the /ws endpoint).
"""
from collections.abc import Callable, Awaitable
from app.models.schemas import (
    AgentTimelineEvent, PipelineResult,
)
from app.services.document_service import ExtractedFile
from app.agents.agent1_intake import run_intake
from app.agents.agent2_extraction import run_extraction
from app.agents.agent3_coding import run_coding
from app.agents.agent4_billing import run_billing
from app.agents.agent5_compliance import run_compliance
from app.agents.agent6_auditor import run_audit
from app.agents.agent7_decision import run_final_decision
from app.agents.agent8_evidence import run_evidence_verification

ProgressCallback = Callable[[AgentTimelineEvent], Awaitable[None]] | None


async def _emit(timeline: list[AgentTimelineEvent], on_progress: ProgressCallback,
                 agent: str, status: str, message: str) -> None:
    event = AgentTimelineEvent(agent=agent, status=status, message=message)
    timeline.append(event)
    if on_progress:
        await on_progress(event)


async def run_pipeline(
    files: list[ExtractedFile],
    case_id: str,
    on_progress: ProgressCallback = None,
) -> PipelineResult:
    timeline: list[AgentTimelineEvent] = []

    await _emit(timeline, on_progress, "Agent 1: Document Intake", "running", "Reading and classifying uploaded documents…")
    intake = await run_intake(files)
    await _emit(timeline, on_progress, "Agent 1: Document Intake", "complete", f"Processed {len(intake.documents)} document(s).")

    await _emit(timeline, on_progress, "Agent 2: Clinical Extraction", "running", "Extracting patient, provider, and clinical findings…")
    extraction = await run_extraction(intake.merged_text)
    await _emit(timeline, on_progress, "Agent 2: Clinical Extraction", "complete", "Clinical fields extracted.")

    await _emit(timeline, on_progress, "Agent 3: Medical Coding", "running", "Generating ICD-10-CM, CPT, HCPCS, and modifiers…")
    coding = await run_coding(intake.merged_text, extraction)
    total_codes = len(coding.icd10) + len(coding.cpt) + len(coding.hcpcs) + len(coding.modifiers)
    await _emit(timeline, on_progress, "Agent 3: Medical Coding", "complete", f"Generated {total_codes} code(s).")

    await _emit(timeline, on_progress, "Agent 4: Medical Billing", "running", "Building billing summary and claim lines…")
    billing = await run_billing(coding, extraction)
    await _emit(timeline, on_progress, "Agent 4: Medical Billing", "complete", f"Claim readiness: {billing.claim_readiness}.")

    await _emit(timeline, on_progress, "Agent 5: Compliance", "running", "Validating guidelines, bundling, and denial risk…")
    compliance = await run_compliance(coding, billing, extraction)
    await _emit(timeline, on_progress, "Agent 5: Compliance", "complete", f"{len(compliance.issues)} issue(s) found.")

    await _emit(timeline, on_progress, "Agent 6: Independent Audit", "running", "Re-reviewing documentation from scratch…")
    audit = await run_audit(intake.merged_text, coding)
    await _emit(timeline, on_progress, "Agent 6: Independent Audit", "complete", f"{len(audit.differences)} difference(s) reconciled.")

    all_codes = (
        audit.independent_coding.icd10 + coding.icd10
        + coding.cpt + coding.hcpcs + coding.modifiers
    )
    await _emit(timeline, on_progress, "Agent 8: Evidence Verification", "running", "Linking every code to its source evidence…")
    evidence = await run_evidence_verification(all_codes, intake)
    await _emit(timeline, on_progress, "Agent 8: Evidence Verification", "complete",
                f"{len(evidence.codes_without_evidence)} code(s) flagged with no evidence found.")

    await _emit(timeline, on_progress, "Agent 7: Final Decision", "running", "Merging outputs into final report…")
    final_report = await run_final_decision(extraction, coding, billing, compliance, audit)
    await _emit(timeline, on_progress, "Agent 7: Final Decision", "complete", f"Status: {final_report.final_status.value}")

    return PipelineResult(
        case_id=case_id,
        timeline=timeline,
        intake=intake,
        extraction=extraction,
        coding=coding,
        billing=billing,
        compliance=compliance,
        audit=audit,
        evidence=evidence,
        final_report=final_report,
    )
