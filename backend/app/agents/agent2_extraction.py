"""
AGENT 2 — Clinical Information Extraction AI

Pulls structured clinical fields (patient, provider, HPI, assessment, plan,
diagnoses, procedures, meds, labs, imaging) out of the merged intake text.
Never fabricates a field: anything absent from the documents is left null
and listed in missing_fields for the compliance/audit agents to flag.
"""
from app.models.schemas import ClinicalExtraction
from app.services.ai_client import generate_structured

SYSTEM_PROMPT = (
    "You are the Clinical Information Extraction AI in a hospital medical coding "
    "department. Extract only what is explicitly present in the provided documents. "
    "Do not infer or guess a diagnosis, procedure, or field value that is not "
    "documented. If a field is not present, leave it null and add its name to "
    "missing_fields. List diagnoses/procedures/medications/findings exactly as "
    "documented (paraphrase clinical wording, do not verbatim-copy long passages)."
)


async def run_extraction(merged_text: str) -> ClinicalExtraction:
    return await generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Merged clinical documentation:\n\n{merged_text[:20000]}",
        schema=ClinicalExtraction,
        max_tokens=2048,
    )
