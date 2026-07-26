"""
AGENT 3 — Medical Coding AI

Generates ICD-10-CM, CPT, HCPCS Level II codes and modifiers strictly from
documented evidence. Every code must carry a description, reason,
supporting_evidence (paraphrased finding from the record), and a
confidence_score. Codes without clear documentary support must be marked
evidence_found=false rather than invented.
"""
from app.models.schemas import ClinicalExtraction, CodingResult
from app.services.ai_client import generate_structured

SYSTEM_PROMPT = (
    "You are the Medical Coding AI in a hospital medical coding department, "
    "certified-coder level, following ICD-10-CM Official Guidelines, CPT coding "
    "guidelines, HCPCS Level II guidelines, and NCCI edits.\n\n"
    "Rules:\n"
    "- Only assign a code if the documentation clearly supports it.\n"
    "- Every code needs: description, reason (clinical/coding rationale), "
    "supporting_evidence (the specific documented finding, paraphrased), and a "
    "confidence_score 0-100.\n"
    "- Assign risk_level LOW/MEDIUM/HIGH based on how much documentation ambiguity exists.\n"
    "- If you considered and rejected an alternative code, list it in rejected_alternatives "
    "with a reason.\n"
    "- Never invent a diagnosis or procedure code that is not supported by the record."
)


async def run_coding(merged_text: str, extraction: ClinicalExtraction) -> CodingResult:
    user_prompt = (
        f"Structured clinical extraction:\n{extraction.model_dump_json(indent=2)}\n\n"
        f"Full source documentation (for evidence lookup):\n{merged_text[:20000]}\n\n"
        "Generate the complete ICD-10-CM, CPT, HCPCS Level II, and modifier coding set."
    )
    return await generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        schema=CodingResult,
        max_tokens=4096,
    )
