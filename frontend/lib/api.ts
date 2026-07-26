import type { PipelineResult, CaseSummary, QualityReport } from "./types";

// Requests go through /api/* which next.config.mjs rewrites to the FastAPI
// backend at localhost:8000 in dev. In production, set NEXT_PUBLIC_API_BASE
// or configure your reverse proxy the same way.

export async function analyzeDocuments(files: File[]): Promise<PipelineResult> {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch("/api/analyze", { method: "POST", body: form });
  if (!res.ok) throw new Error(`Analyze failed: ${res.status} ${await res.text()}`);
  return res.json();
}

export async function getCase(caseId: string): Promise<PipelineResult> {
  const res = await fetch(`/api/cases/${caseId}`);
  if (!res.ok) throw new Error(`Case not found: ${caseId}`);
  return res.json();
}

export async function listCases(): Promise<CaseSummary[]> {
  const res = await fetch("/api/cases");
  if (!res.ok) throw new Error("Failed to list cases");
  return res.json();
}

export async function getQualityReport(): Promise<QualityReport> {
  const res = await fetch("/api/feedback/quality-report");
  if (!res.ok) throw new Error("Failed to load quality report");
  return res.json();
}

export async function submitCorrection(payload: {
  case_id: string;
  code: string;
  original_ai_decision: string;
  human_correction: string;
  reason_for_correction: string;
  specialty?: string;
  department?: string;
  reviewer?: string;
}): Promise<void> {
  const res = await fetch("/api/feedback/correction", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to submit correction");
}

export function exportUrl(caseId: string, format: "json" | "pdf" | "excel"): string {
  return `/api/cases/${caseId}/export/${format}`;
}
