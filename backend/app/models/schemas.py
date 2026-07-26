"""
Shared data contracts for the 9-agent pipeline.
Every agent consumes and returns these typed structures so outputs are
predictable JSON, never free text, and can be persisted / diffed / rendered.
"""
from __future__ import annotations
from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FinalStatus(str, Enum):
    READY = "READY_FOR_SUBMISSION"
    MANUAL_REVIEW = "REQUIRES_MANUAL_REVIEW"


# ---------- Agent 1: Document Intake ----------

class IntakeDocument(BaseModel):
    filename: str
    document_type: str  # e.g. "Progress Note", "Radiology Report", "Insurance Card"
    page_count: int = 1
    extracted_text: str
    ocr_used: bool = False
    ocr_confidence: Optional[float] = None


class IntakeResult(BaseModel):
    documents: list[IntakeDocument]
    merged_text: str
    warnings: list[str] = Field(default_factory=list)


# ---------- Agent 2: Clinical Extraction ----------

class ClinicalExtraction(BaseModel):
    patient_name: Optional[str] = None
    patient_dob: Optional[str] = None
    patient_sex: Optional[str] = None
    provider_name: Optional[str] = None
    facility_name: Optional[str] = None
    visit_date: Optional[str] = None
    history: Optional[str] = None
    chief_complaint: Optional[str] = None
    assessment: Optional[str] = None
    plan: Optional[str] = None
    diagnoses_mentioned: list[str] = Field(default_factory=list)
    procedures_mentioned: list[str] = Field(default_factory=list)
    medications: list[str] = Field(default_factory=list)
    lab_findings: list[str] = Field(default_factory=list)
    radiology_findings: list[str] = Field(default_factory=list)
    medical_necessity_notes: Optional[str] = None
    missing_fields: list[str] = Field(default_factory=list)


# ---------- Agent 3: Medical Coding ----------

class CodeEntry(BaseModel):
    code: str
    code_type: str  # ICD-10-CM | CPT | HCPCS | MODIFIER
    description: str
    reason: str
    supporting_evidence: str
    confidence_score: float = Field(ge=0, le=100)
    risk_level: RiskLevel = RiskLevel.LOW
    evidence_found: bool = True


class CodingResult(BaseModel):
    icd10: list[CodeEntry] = Field(default_factory=list)
    cpt: list[CodeEntry] = Field(default_factory=list)
    hcpcs: list[CodeEntry] = Field(default_factory=list)
    modifiers: list[CodeEntry] = Field(default_factory=list)
    rejected_alternatives: list[dict] = Field(default_factory=list)  # code, reason_rejected


# ---------- Agent 4: Billing ----------

class ProcedureLine(BaseModel):
    cpt_or_hcpcs: str
    description: str
    units: int = 1
    modifiers: list[str] = Field(default_factory=list)


class BillingResult(BaseModel):
    primary_diagnosis: Optional[str] = None
    secondary_diagnoses: list[str] = Field(default_factory=list)
    procedure_lines: list[ProcedureLine] = Field(default_factory=list)
    claim_readiness: str = "INCOMPLETE"
    medical_necessity_summary: str = ""
    estimated_claim_notes: str = ""


# ---------- Agent 5: Compliance ----------

class ComplianceIssue(BaseModel):
    category: str  # e.g. "Bundling", "Modifier Validation", "Age Validation"
    severity: RiskLevel
    description: str
    related_code: Optional[str] = None
    recommendation: str


class ComplianceResult(BaseModel):
    issues: list[ComplianceIssue] = Field(default_factory=list)
    denial_risks: list[str] = Field(default_factory=list)
    passed_checks: list[str] = Field(default_factory=list)


# ---------- Agent 6: Independent Audit ----------

class AuditDifference(BaseModel):
    code: str
    original_decision: str
    audit_decision: str
    explanation: str
    correction_applied: bool


class AuditResult(BaseModel):
    independent_coding: CodingResult
    differences: list[AuditDifference] = Field(default_factory=list)
    audit_summary: str = ""


# ---------- Agent 7: Final Decision ----------

class FinalReport(BaseModel):
    case_id: str
    executive_summary: str
    patient_info: ClinicalExtraction
    diagnosis_table: list[CodeEntry]
    procedure_table: list[CodeEntry]
    hcpcs_table: list[CodeEntry]
    modifier_table: list[CodeEntry]
    billing_summary: BillingResult
    medical_necessity_review: str
    documentation_review: str
    compliance_review: ComplianceResult
    denial_risks: list[str]
    audit_result: AuditResult
    confidence_score: float
    recommendations: list[str]
    final_status: FinalStatus
    generated_at: datetime = Field(default_factory=datetime.utcnow)


# ---------- Agent 8: Evidence Verification ----------

class EvidenceLink(BaseModel):
    code: str
    document_source: str
    quoted_finding: str  # short paraphrase, not verbatim doc text beyond fair use
    justification: str
    confidence_score: float
    evidence_found: bool = True


class EvidenceResult(BaseModel):
    links: list[EvidenceLink] = Field(default_factory=list)
    codes_without_evidence: list[str] = Field(default_factory=list)


# ---------- Agent 9: Continuous Learning ----------

class CorrectionRecord(BaseModel):
    id: Optional[int] = None
    case_id: str
    code: str
    original_ai_decision: str
    human_correction: str
    reason_for_correction: str
    specialty: Optional[str] = None
    department: Optional[str] = None
    reviewer: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QualityReport(BaseModel):
    total_claims_reviewed: int
    ai_accuracy_pct: float
    total_human_corrections: int
    common_errors: list[dict]
    denial_prediction_rate: float
    most_frequent_issues: list[dict]


# ---------- Pipeline wrapper ----------

class AgentTimelineEvent(BaseModel):
    agent: str
    status: str  # "running" | "complete" | "error"
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class PipelineResult(BaseModel):
    case_id: str
    timeline: list[AgentTimelineEvent]
    intake: IntakeResult
    extraction: ClinicalExtraction
    coding: CodingResult
    billing: BillingResult
    compliance: ComplianceResult
    audit: AuditResult
    evidence: EvidenceResult
    final_report: FinalReport
