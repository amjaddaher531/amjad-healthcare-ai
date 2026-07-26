"use client";

import { useState } from "react";
import { Download, FileJson, FileSpreadsheet, FileOutput, CheckCircle2, AlertTriangle } from "lucide-react";
import type { PipelineResult } from "@/lib/types";
import CodeTable from "./CodeTable";
import CompliancePanel from "./CompliancePanel";
import AuditPanel from "./AuditPanel";
import { exportUrl } from "@/lib/api";

const TABS = ["Overview", "Diagnosis (ICD-10)", "Procedures (CPT)", "HCPCS", "Modifiers", "Billing", "Compliance", "Audit"] as const;
type Tab = (typeof TABS)[number];

export default function ReportView({ result }: { result: PipelineResult }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const fr = result.final_report;
  const isReady = fr.final_status === "READY_FOR_SUBMISSION";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="rounded-lg border border-ink-700 bg-gradient-to-br from-ink-900 to-ink-950 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono-code text-xs text-slate-500">CASE {fr.case_id}</p>
            <h2 className="font-display mt-1 text-xl font-semibold text-slate-50">Final Report</h2>
            <div
              className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                isReady
                  ? "border-teal-500/40 bg-teal-500/10 text-teal-300"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-400"
              }`}
            >
              {isReady ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}
              {isReady ? "Ready for Submission" : "Requires Manual Review"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="font-mono-code text-2xl font-semibold text-slate-50">
              {fr.confidence_score.toFixed(0)}%
            </span>
            <span className="text-xs text-slate-500">Overall confidence</span>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{fr.executive_summary}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <a href={exportUrl(fr.case_id, "pdf")} className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-teal-600">
            <FileOutput className="h-3.5 w-3.5" /> Download PDF
          </a>
          <a href={exportUrl(fr.case_id, "excel")} className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-teal-600">
            <FileSpreadsheet className="h-3.5 w-3.5" /> Export Excel
          </a>
          <a href={exportUrl(fr.case_id, "json")} className="inline-flex items-center gap-1.5 rounded-md border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-teal-600">
            <FileJson className="h-3.5 w-3.5" /> Download JSON
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-ink-800 pb-px scrollbar-thin">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`shrink-0 rounded-t-md px-3 py-2 text-sm font-medium transition-colors ${
              tab === t ? "border-b-2 border-teal-400 text-teal-300" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "Overview" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <InfoCard title="Patient Information">
            <Field label="Patient" value={fr.patient_info.patient_name} />
            <Field label="DOB" value={fr.patient_info.patient_dob} />
            <Field label="Sex" value={fr.patient_info.patient_sex} />
            <Field label="Provider" value={fr.patient_info.provider_name} />
            <Field label="Facility" value={fr.patient_info.facility_name} />
            <Field label="Visit date" value={fr.patient_info.visit_date} />
          </InfoCard>
          <InfoCard title="Medical Necessity & Documentation">
            <p className="text-sm text-slate-300">{fr.medical_necessity_review}</p>
            <p className="mt-3 text-sm text-slate-300">{fr.documentation_review}</p>
          </InfoCard>
          <InfoCard title="Recommendations" full>
            <ul className="flex flex-col gap-1.5">
              {fr.recommendations.map((r, i) => (
                <li key={i} className="text-sm text-slate-300">• {r}</li>
              ))}
            </ul>
          </InfoCard>
        </div>
      )}

      {tab === "Diagnosis (ICD-10)" && (
        <CodeTable title="ICD-10-CM codes" codes={fr.diagnosis_table} evidenceLinks={result.evidence.links} caseId={fr.case_id} />
      )}
      {tab === "Procedures (CPT)" && (
        <CodeTable title="CPT codes" codes={fr.procedure_table} evidenceLinks={result.evidence.links} caseId={fr.case_id} />
      )}
      {tab === "HCPCS" && (
        <CodeTable title="HCPCS codes" codes={fr.hcpcs_table} evidenceLinks={result.evidence.links} caseId={fr.case_id} />
      )}
      {tab === "Modifiers" && (
        <CodeTable title="Modifiers" codes={fr.modifier_table} evidenceLinks={result.evidence.links} caseId={fr.case_id} />
      )}

      {tab === "Billing" && (
        <div className="flex flex-col gap-4">
          <InfoCard title="Billing Summary">
            <Field label="Primary diagnosis" value={fr.billing_summary.primary_diagnosis} />
            <Field label="Secondary diagnoses" value={fr.billing_summary.secondary_diagnoses.join(", ") || "None"} />
            <Field label="Claim readiness" value={fr.billing_summary.claim_readiness} />
          </InfoCard>
          <div className="overflow-hidden rounded-lg border border-ink-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Code</th>
                  <th className="px-4 py-2.5 font-medium">Description</th>
                  <th className="px-4 py-2.5 font-medium">Units</th>
                  <th className="px-4 py-2.5 font-medium">Modifiers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-800">
                {fr.billing_summary.procedure_lines.map((p, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3 font-mono-code text-teal-300">{p.cpt_or_hcpcs}</td>
                    <td className="px-4 py-3 text-slate-200">{p.description}</td>
                    <td className="px-4 py-3 text-slate-300">{p.units}</td>
                    <td className="px-4 py-3 text-slate-300">{p.modifiers.join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "Compliance" && <CompliancePanel compliance={fr.compliance_review} />}
      {tab === "Audit" && <AuditPanel audit={fr.audit_result} />}
    </div>
  );
}

function InfoCard({ title, children, full }: { title: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={`rounded-lg border border-ink-700 bg-ink-900/40 p-4 ${full ? "sm:col-span-2" : ""}`}>
      <h4 className="font-display text-sm font-medium text-slate-100">{title}</h4>
      <div className="mt-3 flex flex-col gap-1.5">{children}</div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="text-right text-slate-200">{value || "Not documented"}</span>
    </div>
  );
}
