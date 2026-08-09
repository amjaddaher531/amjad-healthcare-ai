"use client";

import { Plus, X } from "lucide-react";

export interface ProcedureChargeLine {
  procedure_code: string;
  description: string;
  service_date: string;
  service_provider: string;
  bill_area: string;
}

export interface CaseFormData {
  patient_name: string;
  patient_file_number: string;
  age: string;
  gender: string;
  guarantor: string;
  service_date: string;
  visit_account: string;
  coverage: string;
  service_provider: string;
  billing_provider: string;
  department: string;
  place_of_service: string;
  bill_area: string;
  procedures: ProcedureChargeLine[];
  case_reference: string;
  amount_requested: string;
  case_notes: string;
  attachment_link: string;
}

export const emptyCaseForm = (): CaseFormData => ({
  patient_name: "",
  patient_file_number: "",
  age: "",
  gender: "",
  guarantor: "",
  service_date: "",
  visit_account: "",
  coverage: "",
  service_provider: "",
  billing_provider: "",
  department: "",
  place_of_service: "",
  bill_area: "",
  procedures: [
    { procedure_code: "", description: "", service_date: "", service_provider: "", bill_area: "" },
  ],
  case_reference: "",
  amount_requested: "",
  case_notes: "",
  attachment_link: "",
});

interface Props {
  value: CaseFormData;
  onChange: (value: CaseFormData) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none";
const labelClass = "block text-xs font-medium text-slate-300 mb-1";

export default function CaseIntakeForm({ value, onChange, disabled }: Props) {
  const setField = (field: keyof CaseFormData, v: string) => {
    onChange({ ...value, [field]: v });
  };

  const setProcedure = (idx: number, field: keyof ProcedureChargeLine, v: string) => {
    const next = [...value.procedures];
    next[idx] = { ...next[idx], [field]: v };
    onChange({ ...value, procedures: next });
  };

  const addProcedure = () => {
    onChange({
      ...value,
      procedures: [
        ...value.procedures,
        { procedure_code: "", description: "", service_date: "", service_provider: "", bill_area: "" },
      ],
    });
  };

  const removeProcedure = (idx: number) => {
    onChange({ ...value, procedures: value.procedures.filter((_, i) => i !== idx) });
  };

  return (
    <fieldset disabled={disabled} className="space-y-8">
      {/* Patient & Billing Info */}
      <div>
        <h3 className="font-display mb-4 text-sm font-semibold text-slate-200">Patient &amp; Billing Info</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className={labelClass}>Patient name</label>
            <input className={inputClass} placeholder="Full name" value={value.patient_name}
              onChange={(e) => setField("patient_name", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Patient file number</label>
            <input className={inputClass} placeholder="File / MRN #" value={value.patient_file_number}
              onChange={(e) => setField("patient_file_number", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Age</label>
            <input className={inputClass} placeholder="e.g. 34" value={value.age}
              onChange={(e) => setField("age", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Gender</label>
            <select className={inputClass} value={value.gender}
              onChange={(e) => setField("gender", e.target.value)}>
              <option value="">— Select —</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Guarantor</label>
            <input className={inputClass} placeholder="Responsible party for billing" value={value.guarantor}
              onChange={(e) => setField("guarantor", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Service date</label>
            <input type="date" className={inputClass} value={value.service_date}
              onChange={(e) => setField("service_date", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Visit account</label>
            <input className={inputClass} placeholder="e.g. AUTO, self-pay, insurance type" value={value.visit_account}
              onChange={(e) => setField("visit_account", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Coverage</label>
            <input className={inputClass} placeholder="e.g. Medicare, Daman, self-pay" value={value.coverage}
              onChange={(e) => setField("coverage", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Service provider</label>
            <input className={inputClass} placeholder="Treating physician" value={value.service_provider}
              onChange={(e) => setField("service_provider", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Billing provider</label>
            <input className={inputClass} placeholder="Physician billed under" value={value.billing_provider}
              onChange={(e) => setField("billing_provider", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Department</label>
            <input className={inputClass} placeholder="e.g. Radiology, Cardiology" value={value.department}
              onChange={(e) => setField("department", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Place of service</label>
            <input className={inputClass} placeholder="e.g. Outpatient clinic" value={value.place_of_service}
              onChange={(e) => setField("place_of_service", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Bill area</label>
            <input className={inputClass} placeholder="Billing branch / department" value={value.bill_area}
              onChange={(e) => setField("bill_area", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Procedures / Charges */}
      <div>
        <h3 className="font-display mb-4 text-sm font-semibold text-slate-200">Procedures / Charges</h3>
        <div className="space-y-3">
          {value.procedures.map((p, idx) => (
            <div key={idx} className="grid grid-cols-1 gap-2 rounded-md border border-ink-700 p-3 sm:grid-cols-5">
              <input className={inputClass} placeholder="99212" value={p.procedure_code}
                onChange={(e) => setProcedure(idx, "procedure_code", e.target.value)} />
              <input className={inputClass} placeholder="e.g. Office visit" value={p.description}
                onChange={(e) => setProcedure(idx, "description", e.target.value)} />
              <input type="date" className={inputClass} value={p.service_date}
                onChange={(e) => setProcedure(idx, "service_date", e.target.value)} />
              <input className={inputClass} placeholder="Provider name" value={p.service_provider}
                onChange={(e) => setProcedure(idx, "service_provider", e.target.value)} />
              <div className="flex items-center gap-2">
                <input className={inputClass} placeholder="Bill area" value={p.bill_area}
                  onChange={(e) => setProcedure(idx, "bill_area", e.target.value)} />
                {value.procedures.length > 1 && (
                  <button type="button" onClick={() => removeProcedure(idx)}
                    className="shrink-0 rounded p-1.5 text-slate-500 hover:bg-ink-800 hover:text-red-400">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addProcedure}
          className="mt-3 flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300">
          <Plus className="h-3.5 w-3.5" /> Add procedure line
        </button>
      </div>

      {/* Case Summary */}
      <div>
        <h3 className="font-display mb-4 text-sm font-semibold text-slate-200">Case Summary &amp; Attachment</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Case / patient reference</label>
            <input className={inputClass} placeholder="e.g. Case #204 or file ref" value={value.case_reference}
              onChange={(e) => setField("case_reference", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Amount requested (AED)</label>
            <input className={inputClass} placeholder="0.00" value={value.amount_requested}
              onChange={(e) => setField("amount_requested", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Case description / notes for coding</label>
            <textarea className={inputClass + " min-h-[80px]"}
              placeholder="Diagnosis, procedures performed, any codes you already have, etc."
              value={value.case_notes} onChange={(e) => setField("case_notes", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Attachment link (optional — Google Drive / WeTransfer)</label>
            <input className={inputClass} placeholder="https://drive.google.com/..." value={value.attachment_link}
              onChange={(e) => setField("attachment_link", e.target.value)} />
            <p className="mt-1 text-xs text-slate-500">
              Optional now — you can upload files directly below instead.
            </p>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
