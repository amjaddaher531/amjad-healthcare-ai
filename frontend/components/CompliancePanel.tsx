import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { ComplianceResult } from "@/lib/types";
import { RiskBadge } from "./Badge";

export default function CompliancePanel({ compliance }: { compliance: ComplianceResult }) {
  return (
    <div className="flex flex-col gap-5">
      {compliance.issues.length > 0 ? (
        <div className="flex flex-col gap-2">
          {compliance.issues.map((issue, i) => (
            <div key={i} className="rounded-lg border border-ink-700 bg-ink-900/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-400" />
                  <span className="font-display text-sm font-medium text-slate-100">{issue.category}</span>
                  {issue.related_code && (
                    <span className="font-mono-code text-xs text-teal-300">{issue.related_code}</span>
                  )}
                </div>
                <RiskBadge level={issue.severity} />
              </div>
              <p className="mt-1.5 text-sm text-slate-300">{issue.description}</p>
              <p className="mt-1 text-xs text-slate-500">→ {issue.recommendation}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-400">No compliance issues identified.</p>
      )}

      {compliance.denial_risks.length > 0 && (
        <div>
          <h4 className="font-display text-sm font-medium text-red-400">Potential Denial Risks</h4>
          <ul className="mt-2 flex flex-col gap-1">
            {compliance.denial_risks.map((r, i) => (
              <li key={i} className="text-sm text-slate-300">• {r}</li>
            ))}
          </ul>
        </div>
      )}

      {compliance.passed_checks.length > 0 && (
        <div>
          <h4 className="font-display text-sm font-medium text-teal-400">Passed Checks</h4>
          <ul className="mt-2 flex flex-col gap-1">
            {compliance.passed_checks.map((r, i) => (
              <li key={i} className="flex items-center gap-1.5 text-sm text-slate-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-teal-400" /> {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
