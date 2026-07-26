import { GitCompare } from "lucide-react";
import type { AuditResult } from "@/lib/types";

export default function AuditPanel({ audit }: { audit: AuditResult }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-4">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-teal-400" />
          <h4 className="font-display text-sm font-medium text-slate-100">Independent Re-Review Summary</h4>
        </div>
        <p className="mt-2 text-sm text-slate-300">{audit.audit_summary}</p>
      </div>

      {audit.differences.length > 0 ? (
        <div className="flex flex-col gap-2">
          {audit.differences.map((d, i) => (
            <div key={i} className="rounded-lg border border-ink-700 bg-ink-950/40 p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-sm text-teal-300">{d.code}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                    d.correction_applied
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {d.correction_applied ? "Corrected" : "Noted, unchanged"}
                </span>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-slate-500">Original</p>
                  <p className="text-sm text-slate-300">{d.original_decision}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Audit</p>
                  <p className="text-sm text-slate-300">{d.audit_decision}</p>
                </div>
              </div>
              <p className="mt-2 text-xs text-slate-400">{d.explanation}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">
          No discrepancies between the original coding and the independent audit review.
        </p>
      )}
    </div>
  );
}
