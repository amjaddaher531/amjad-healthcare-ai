"""
Core analysis API: upload documents, run the full 9-agent pipeline, and
retrieve / export results. This is the single "Analyze" button endpoint.
"""
import json
import uuid
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_session
from app.db.models import Case
from app.models.schemas import PipelineResult
from app.services.document_service import extract_file
from app.agents.orchestrator import run_pipeline
from app.services.export_service import build_pdf, build_excel
from app.api.dependencies import get_current_user

router = APIRouter(prefix="/api", tags=["analyze"])


@router.post("/analyze", response_model=PipelineResult)
async def analyze_documents(
    files: list[UploadFile] = File(...),
    case_form: str | None = Form(None),
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    if not files:
        raise HTTPException(400, "No files uploaded.")

    if case_form:
        try:
            json.loads(case_form)
        except json.JSONDecodeError:
            raise HTTPException(400, "Invalid case_form JSON.")

    extracted = []
    for f in files:
        data = await f.read()
        try:
            extracted.append(extract_file(f.filename, data))
        except ValueError as e:
            raise HTTPException(400, str(e))

    case_id = str(uuid.uuid4())[:8].upper()
    result = await run_pipeline(extracted, case_id=case_id)

    case = Case(
        id=result.final_report.case_id,
        status=result.final_report.final_status.value,
        confidence_score=result.final_report.confidence_score,
        result_json=result.model_dump_json(),
        case_form_json=case_form,
    )
    session.add(case)
    await session.commit()
    return result


@router.get("/cases/{case_id}", response_model=PipelineResult)
async def get_case(
    case_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    case = await session.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found.")
    return PipelineResult.model_validate(json.loads(case.result_json))


@router.get("/cases")
async def list_cases(
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    from sqlalchemy import select
    rows = (await session.execute(select(Case).order_by(Case.created_at.desc()))).scalars().all()
    return [
        {"case_id": r.id, "status": r.status, "confidence_score": r.confidence_score,
         "created_at": r.created_at.isoformat()}
        for r in rows
    ]


@router.get("/cases/{case_id}/export/json")
async def export_json(
    case_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    case = await session.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found.")
    return Response(content=case.result_json, media_type="application/json",
                     headers={"Content-Disposition": f"attachment; filename=case_{case_id}.json"})


@router.get("/cases/{case_id}/export/pdf")
async def export_pdf(
    case_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    case = await session.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found.")
    result = PipelineResult.model_validate(json.loads(case.result_json))
    pdf_bytes = build_pdf(result)
    return Response(content=pdf_bytes, media_type="application/pdf",
                     headers={"Content-Disposition": f"attachment; filename=case_{case_id}.pdf"})


@router.get("/cases/{case_id}/export/excel")
async def export_excel(
    case_id: str,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    case = await session.get(Case, case_id)
    if not case:
        raise HTTPException(404, "Case not found.")
    result = PipelineResult.model_validate(json.loads(case.result_json))
    xlsx_bytes = build_excel(result)
    return Response(content=xlsx_bytes,
                     media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                     headers={"Content-Disposition": f"attachment; filename=case_{case_id}.xlsx"})
