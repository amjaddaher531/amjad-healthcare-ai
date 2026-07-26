"""
AGENT 5 — Compliance AI

Validates the coding/billing output against documentation requirements,
age/gender edits, medical necessity, modifier rules, NCCI bundling,
duplicate codes, unsupported codes, and missing documentation — and
predicts denial risk.
"""
from app.models.schemas import ComplianceResult, CodingResult, BillingResult, ClinicalExtraction
from app.services.ai_client import generate_structured

SYSTEM_PROMPT = (
    "You are the Compliance AI in a hospital medical coding department. Review "
    "the coding and billing output against: ICD-10-CM/CPT/HCPCS coding guidelines, "
    "documentation requirements, age and gender edits, medical necessity, modifier "
    "validation, NCCI bundling edits, duplicate codes, unsupported codes, and missing "
    "documentation. For every issue found, state category, severity (LOW/MEDIUM/HIGH), "
    "a clear description, the related_code if applicable, and a concrete recommendation. "
    "List denial_risks as short actionable statements. List passed_checks for things that "
    "are compliant, to show the review was thorough, not just a list of problems."
)


async def run_compliance(coding: CodingResult, billing: BillingResult, extraction: ClinicalExtraction) -> ComplianceResult:
    user_prompt = (
        f"Clinical extraction:\n{extraction.model_dump_json(indent=2)}\n\n"
        f"Coding:\n{coding.model_dump_json(indent=2)}\n\n"
        f"Billing:\n{billing.model_dump_json(indent=2)}"
    )
    return await generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        schema=ComplianceResult,
        max_tokens=3072,
    )
