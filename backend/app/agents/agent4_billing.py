"""
AGENT 4 — Medical Billing AI

Turns the coding output into a billable claim shape: primary/secondary
diagnoses, ordered procedure lines with units and modifiers, a claim
readiness flag, and a medical necessity summary tied to documentation.
"""
from app.models.schemas import BillingResult, CodingResult, ClinicalExtraction
from app.services.ai_client import generate_structured

SYSTEM_PROMPT = (
    "You are the Medical Billing AI in a hospital Revenue Cycle Management "
    "department. Convert finalized coding into a billing-ready structure: "
    "primary diagnosis, secondary diagnoses, ordered procedure lines "
    "(code, description, units, modifiers), a claim_readiness assessment "
    "('READY' or 'INCOMPLETE: <reason>'), and a medical_necessity_summary that "
    "ties each billed procedure back to documented clinical need. Do not add "
    "any code that was not already produced by the coding step."
)


async def run_billing(coding: CodingResult, extraction: ClinicalExtraction) -> BillingResult:
    user_prompt = (
        f"Coding result:\n{coding.model_dump_json(indent=2)}\n\n"
        f"Clinical extraction:\n{extraction.model_dump_json(indent=2)}"
    )
    return await generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        schema=BillingResult,
        max_tokens=2048,
    )
