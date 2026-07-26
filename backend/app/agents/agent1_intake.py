"""
AGENT 1 — Document Intake AI

Responsibility: turn raw uploaded files into structured, typed, merged
clinical text. OCR is handled by document_service; this agent's AI call
only classifies document type and flags obvious extraction problems, so
downstream agents don't waste tokens re-deriving that context.
"""
from app.models.schemas import IntakeDocument, IntakeResult
from app.services.ai_client import generate_structured
from app.services.document_service import ExtractedFile
from pydantic import BaseModel


class _DocTypeGuess(BaseModel):
    document_type: str
    warnings: list[str] = []


SYSTEM_PROMPT = (
    "You are the Document Intake AI for a hospital medical coding department. "
    "Given raw extracted text from one uploaded file, classify its clinical document "
    "type (e.g. Progress Note, Operative Report, Radiology Report, Laboratory Report, "
    "Discharge Summary, Consultation Note, Insurance Document, Unknown). "
    "Flag warnings if the text looks incomplete, garbled (poor OCR), or unrelated to "
    "clinical documentation."
)


async def run_intake(files: list[ExtractedFile]) -> IntakeResult:
    documents: list[IntakeDocument] = []
    warnings: list[str] = []

    for f in files:
        if not f.text.strip():
            documents.append(IntakeDocument(
                filename=f.filename, document_type="Unreadable", page_count=f.page_count,
                extracted_text="", ocr_used=f.ocr_used, ocr_confidence=f.ocr_confidence,
            ))
            warnings.append(f"{f.filename}: no extractable text found (check scan quality).")
            continue

        guess = await generate_structured(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=f"Filename: {f.filename}\n\nExtracted text:\n{f.text[:6000]}",
            schema=_DocTypeGuess,
            max_tokens=512,
        )
        documents.append(IntakeDocument(
            filename=f.filename,
            document_type=guess.document_type,
            page_count=f.page_count,
            extracted_text=f.text,
            ocr_used=f.ocr_used,
            ocr_confidence=f.ocr_confidence,
        ))
        warnings.extend(f"{f.filename}: {w}" for w in guess.warnings)

        if f.ocr_used and f.ocr_confidence is not None and f.ocr_confidence < 60:
            warnings.append(f"{f.filename}: low OCR confidence ({f.ocr_confidence:.0f}%) — verify manually.")

    merged_text = "\n\n---\n\n".join(
        f"[{d.document_type} | {d.filename}]\n{d.extracted_text}" for d in documents
    )

    return IntakeResult(documents=documents, merged_text=merged_text, warnings=warnings)
