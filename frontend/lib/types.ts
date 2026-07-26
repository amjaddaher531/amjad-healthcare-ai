// Mirrors backend/app/models/schemas.py — keep in sync with the API contract.

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type FinalStatus = "READY_FOR_SUBMISSION" | "REQUIRES_MANUAL_REVIEW";

export interface CodeEntry {
  code: string;
  code_type: "ICD-10-CM" | "CPT" | "HCPCS" | "MODIFIER" | string;
  description: string;
  reason: string;
  supporting_evidence: string;
  confidence_score: number;
  risk_level: RiskLevel;
  evidence_found: boolean;
}

export interface ClinicalExtraction {
  patient_name?: string | null;
  patient_dob?: string | null;
  patient_sex?: string | null;
  provider_name?: string | null;
  facility_name?: string | null;
  visit_date?: string | null;
  history?: string | null;
  chief_complaint?: string | null;
  assessment?: string | null;
  plan?: string | null;
  diagnoses_mentioned: string[];
  procedures_mentioned: string[];
  medications: string[];
  lab_findings: string[];
  radiology_findings: string[];
  medical_necessity_notes?: string | null;
  missing_fields: string[];
}

export interface ProcedureLine {
  cpt_or_hcpcs: string;
  description: string;
  units: number;
  modifiers: string[];
}

export interface BillingResult {
  primary_diagnosis?: string | null;
  secondary_diagnoses: string[];
  procedure_lines: ProcedureLine[];
  claim_readiness: string;
  medical_necessity_summary: string;
  estimated_claim_notes: string;
}

export interface ComplianceIssue {
  category: string;
  severity: RiskLevel;
  description: string;
  related_code?: string | null;
  recommendation: string;
}

export interface ComplianceResult {
  issues: ComplianceIssue[];
  denial_risks: string[];
  passed_checks: string[];
}

export interface AuditDifference {
  code: string;
  original_decision: string;
  audit_decision: string;
  explanation: string;
  correction_applied: boolean;
}

export interface CodingResult {
  icd10: CodeEntry[];
  cpt: CodeEntry[];
  hcpcs: CodeEntry[];
  modifiers: CodeEntry[];
  rejected_alternatives: Record<string, string>[];
}

export interface AuditResult {
  independent_coding: CodingResult;
  differences: AuditDifference[];
  audit_summary: string;
}

export interface EvidenceLink {
  code: string;
  document_source: string;
  quoted_finding: string;
  justification: string;
  confidence_score: number;
  evidence_found: boolean;
}

export interface EvidenceResult {
  links: EvidenceLink[];
  codes_without_evidence: string[];
}

export interface IntakeDocument {
  filename: string;
  document_type: string;
  page_count: number;
  extracted_text: string;
  ocr_used: boolean;
  ocr_confidence?: number | null;
}

export interface IntakeResult {
  documents: IntakeDocument[];
  merged_text: string;
  warnings: string[];
}

export interface FinalReport {
  case_id: string;
  executive_summary: string;
  patient_info: ClinicalExtraction;
  diagnosis_table: CodeEntry[];
  procedure_table: CodeEntry[];
  hcpcs_table: CodeEntry[];
  modifier_table: CodeEntry[];
  billing_summary: BillingResult;
  medical_necessity_review: string;
  documentation_review: string;
  compliance_review: ComplianceResult;
  denial_risks: string[];
  audit_result: AuditResult;
  confidence_score: number;
  recommendations: string[];
  final_status: FinalStatus;
  generated_at: string;
}

export interface AgentTimelineEvent {
  agent: string;
  status: "running" | "complete" | "error";
  message: string;
  timestamp: string;
}

export interface PipelineResult {
  case_id: string;
  timeline: AgentTimelineEvent[];
  intake: IntakeResult;
  extraction: ClinicalExtraction;
  coding: CodingResult;
  billing: BillingResult;
  compliance: ComplianceResult;
  audit: AuditResult;
  evidence: EvidenceResult;
  final_report: FinalReport;
}

export interface CaseSummary {
  case_id: string;
  status: string;
  confidence_score: number;
  created_at: string;
}

export interface QualityReport {
  total_claims_reviewed: number;
  ai_accuracy_pct: number;
  total_human_corrections: number;
  common_errors: { reason: string; count: number }[];
  denial_prediction_rate: number;
  most_frequent_issues: { specialty: string; corrections: number }[];
}
