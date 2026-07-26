"""
AGENT 6 — Medical Auditor AI

Deliberately ignores every prior agent's decision and re-derives coding
from the raw documentation independently (a fresh call with no memory of
agents 2-5's output). Then diffs its independent coding against the
original coding set, explains any differences, and states whether each
was corrected.
"""
from app.models.schemas import AuditResult, AuditDifference, CodingResult
from app.services.ai_client import generate_structured

INDEPENDENT_SYSTEM_PROMPT = (
    "You are an independent Medical Auditor AI performing a from-scratch chart "
    "review. You have NOT seen any other AI's coding decisions. Read the raw "
    "documentation below and produce your own complete, independent ICD-10-CM, "
    "CPT, HCPCS, and modifier coding set, following the same rules as a certified "
    "coder: every code must have supporting_evidence from the text, a reason, and "
    "a confidence_score. Never invent unsupported codes."
)

DIFF_SYSTEM_PROMPT = (
    "You are the Medical Auditor AI comparing two independently generated coding "
    "sets for the same patient encounter: the original department coding, and your "
    "own independent re-review. For every code that differs (added, removed, or "
    "changed) between the two, explain why the difference exists and state which "
    "version is correct per coding guidelines (correction_applied=true if the audit "
    "changes the final answer). Also produce a short audit_summary paragraph."
)


from pydantic import BaseModel


class _DiffList(BaseModel):
    differences: list[AuditDifference]
    audit_summary: str


async def run_audit(merged_text: str, original_coding: CodingResult) -> AuditResult:
    independent_coding = await generate_structured(
        system_prompt=INDEPENDENT_SYSTEM_PROMPT,
        user_prompt=f"Raw documentation:\n\n{merged_text[:20000]}",
        schema=CodingResult,
        max_tokens=4096,
    )

    diff = await generate_structured(
        system_prompt=DIFF_SYSTEM_PROMPT,
        user_prompt=(
            f"Original coding:\n{original_coding.model_dump_json(indent=2)}\n\n"
            f"Independent audit coding:\n{independent_coding.model_dump_json(indent=2)}"
        ),
        schema=_DiffList,
        max_tokens=3072,
    )

    return AuditResult(
        independent_coding=independent_coding,
        differences=diff.differences,
        audit_summary=diff.audit_summary,
    )
