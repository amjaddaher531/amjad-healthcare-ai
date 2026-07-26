"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, TrendingUp, ClipboardList, ShieldAlert } from "lucide-react";
import { getQualityReport, listCases } from "@/lib/api";
import type { QualityReport, CaseSummary } from "@/lib/types";

export default function DashboardPage() {
  const [report, setReport] = useState<QualityReport | null>(null);
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getQualityReport(), listCases()])
      .then(([r, c]) => {
        setReport(r);
        setCases(c);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-teal-400 hover:text-teal-300">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Analyze
      </Link>

      <h1 className="font-display text-xl font-semibold text-slate-50">AI Performance Dashboard</h1>
      <p className="mt-1 text-sm text-slate-400">
        Aggregate accuracy, human corrections, and denial-risk patterns from Agent 9's continuous
        learning knowledge base.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-slate-500">Loading metrics…</p>
      ) : report ? (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={ClipboardList} label="Claims Reviewed" value={report.total_claims_reviewed} />
            <Stat icon={TrendingUp} label="AI Accuracy" value={`${report.ai_accuracy_pct}%`} accent />
            <Stat icon={Activity} label="Human Corrections" value={report.total_human_corrections} />
            <Stat icon={ShieldAlert} label="Denial Prediction Rate" value={`${report.denial_prediction_rate}%`} warn />
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-5">
              <h3 className="font-display text-sm font-medium text-slate-100">Most Common Correction Reasons</h3>
              {report.common_errors.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No corrections recorded yet.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {report.common_errors.map((e, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{e.reason}</span>
                      <span className="font-mono-code text-teal-300">{e.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-5">
              <h3 className="font-display text-sm font-medium text-slate-100">Most Frequent Issues by Specialty</h3>
              {report.most_frequent_issues.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No specialty data recorded yet.</p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {report.most_frequent_issues.map((s, i) => (
                    <li key={i} className="flex items-center justify-between text-sm">
                      <span className="text-slate-300">{s.specialty}</span>
                      <span className="font-mono-code text-teal-300">{s.corrections}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="font-display mb-3 text-sm font-medium text-slate-100">Recent Cases</h3>
            <div className="overflow-hidden rounded-lg border border-ink-700">
              <table className="w-full text-left text-sm">
                <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-slate-400">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Case ID</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5 font-medium">Confidence</th>
                    <th className="px-4 py-2.5 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-800">
                  {cases.length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-500">No cases analyzed yet.</td></tr>
                  )}
                  {cases.map((c) => (
                    <tr key={c.case_id}>
                      <td className="px-4 py-3 font-mono-code text-teal-300">{c.case_id}</td>
                      <td className="px-4 py-3 text-slate-300">{c.status}</td>
                      <td className="px-4 py-3 text-slate-300">{c.confidence_score.toFixed(0)}%</td>
                      <td className="px-4 py-3 text-slate-500">{new Date(c.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-8 text-sm text-red-400">Failed to load dashboard data.</p>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent, warn }: { icon: any; label: string; value: string | number; accent?: boolean; warn?: boolean }) {
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-4">
      <Icon className={`h-4 w-4 ${accent ? "text-teal-400" : warn ? "text-amber-400" : "text-slate-400"}`} />
      <p className="mt-3 font-mono-code text-2xl font-semibold text-slate-50">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
