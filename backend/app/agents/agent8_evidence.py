"""
AGENT 8 — Evidence Verification AI

For every code in the final report, links it back to the exact document
and finding that justified it, so the frontend can render a clickable
"why this code" view. Codes with no traceable support are marked
evidence_found=false and routed to codes_without_evidence for manual review.
"""
from app.models.schemas import EvidenceResult, EvidenceLink, IntakeResult, CodeEntry
from app.services.ai_client import generate_structured
from pydantic import BaseModel


class _LinkList(BaseModel):
    links: list[EvidenceLink]


SYSTEM_PROMPT = (
    "You are the Evidence Verification AI. For each medical code provided, locate "
    "the specific document and clinical finding in the source documentation that "
    "justifies it. document_source should name the file/document type it came from. "
    "quoted_finding must be a short paraphrase (never a long verbatim quote) of the "
    "supporting text. justification explains why that finding supports the code. "
    "If you cannot find clear supporting text for a code, set evidence_found=false "
    "and confidence_score below 50."
)


async def run_evidence_verification(all_codes: list[CodeEntry], intake: IntakeResult) -> EvidenceResult:
    docs_summary = "\n\n".join(
        f"DOCUMENT: {d.filename} ({d.document_type})\n{d.extracted_text[:4000]}"
        for d in intake.documents
    )
    codes_summary = "\n".join(f"- {c.code_type} {c.code}: {c.description}" for c in all_codes)

    result = await generate_structured(
        system_prompt=SYSTEM_PROMPT,
        user_prompt=f"Codes to verify:\n{codes_summary}\n\nSource documents:\n{docs_summary[:20000]}",
        schema=_LinkList,
        max_tokens=4096,
    )

    codes_without_evidence = [link.code for link in result.links if not link.evidence_found]
    return EvidenceResult(links=result.links, codes_without_evidence=codes_without_evidence)
