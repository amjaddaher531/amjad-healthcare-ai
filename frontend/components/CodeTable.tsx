"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ThumbsUp, ThumbsDown, Pencil, ShieldAlert } from "lucide-react";
import type { CodeEntry, EvidenceLink } from "@/lib/types";
import { RiskBadge, ConfidenceBar } from "./Badge";
import { submitCorrection } from "@/lib/api";

interface Props {
  title: string;
  codes: CodeEntry[];
  evidenceLinks: EvidenceLink[];
  caseId: string;
}

export default function CodeTable({ title, codes, evidenceLinks, caseId }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modifyingCode, setModifyingCode] = useState<string | null>(null);
  const [correctionText, setCorrectionText] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [savedFeedback, setSavedFeedback] = useState<Record<string, "approved" | "rejected" | "modified">>({});

  if (codes.length === 0) {
    return (
      <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-6 text-sm text-slate-400">
        No {title.toLowerCase()} identified in the documentation.
      </div>
    );
  }

  const evidenceFor = (code: string) => evidenceLinks.find((e) => e.code === code);

  const handleFeedback = async (c: CodeEntry, action: "approved" | "rejected" | "modified", correction?: string, reason?: string) => {
    setSavedFeedback((prev) => ({ ...prev, [c.code]: action }));
    if (action !== "approved") {
      await submitCorrection({
        case_id: caseId,
        code: c.code,
        original_ai_decision: `${c.code} — ${c.description}`,
        human_correction: correction ?? action.toUpperCase(),
        reason_for_correction: reason ?? "",
      }).catch(() => {});
    }
    setModifyingCode(null);
    setCorrectionText("");
    setReasonText("");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-ink-700">
      <table className="w-full text-left text-sm">
        <thead className="bg-ink-900/80 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-2.5 font-medium">Code</th>
            <th className="px-4 py-2.5 font-medium">Description</th>
            <th className="px-4 py-2.5 font-medium">Confidence</th>
            <th className="px-4 py-2.5 font-medium">Risk</th>
            <th className="px-4 py-2.5 font-medium">Review</th>
            <th className="px-4 py-2.5 font-medium" />
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-800">
          {codes.map((c) => {
            const isOpen = expanded === c.code;
            const evidence = evidenceFor(c.code);
            const feedback = savedFeedback[c.code];
            return (
              <Fragment key={c.code}>
                <tr
                  className="cursor-pointer bg-ink-950/40 hover:bg-ink-900/60"
                  onClick={() => setExpanded(isOpen ? null : c.code)}
                >
                  <td className="px-4 py-3 font-mono-code text-teal-300">{c.code}</td>
                  <td className="max-w-xs px-4 py-3 text-slate-200">{c.description}</td>
                  <td className="px-4 py-3"><ConfidenceBar score={c.confidence_score} /></td>
                  <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                  <td className="px-4 py-3">
                    {!c.evidence_found ? (
                      <span className="flex items-center gap-1 text-xs text-red-400">
                        <ShieldAlert className="h-3.5 w-3.5" /> Evidence not found
                      </span>
                    ) : feedback ? (
                      <span className="text-xs capitalize text-slate-400">{feedback}</span>
                    ) : (
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleFeedback(c, "approved")}
                          className="rounded p-1 text-slate-400 hover:bg-teal-500/10 hover:text-teal-300"
                          title="Approve"
                        >
                          <ThumbsUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleFeedback(c, "rejected", "REJECTED", "Coder rejected suggestion")}
                          className="rounded p-1 text-slate-400 hover:bg-red-500/10 hover:text-red-400"
                          title="Reject"
                        >
                          <ThumbsDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setModifyingCode(modifyingCode === c.code ? null : c.code)}
                          className="rounded p-1 text-slate-400 hover:bg-amber-500/10 hover:text-amber-400"
                          title="Modify"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ChevronDown className={`ml-auto h-4 w-4 text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </td>
                </tr>

                {modifyingCode === c.code && (
                  <tr>
                    <td colSpan={6} className="border-t border-ink-800 bg-ink-900/60 px-4 py-3">
                      <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                        <input
                          value={correctionText}
                          onChange={(e) => setCorrectionText(e.target.value)}
                          placeholder="Corrected code or value"
                          className="rounded-md border border-ink-700 bg-ink-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                        />
                        <input
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          placeholder="Reason for correction"
                          className="rounded-md border border-ink-700 bg-ink-950 px-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-teal-500 focus:outline-none"
                        />
                        <button
                          onClick={() => handleFeedback(c, "modified", correctionText, reasonText)}
                          className="self-start rounded-md bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-500"
                        >
                          Save correction
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {isOpen && (
                  <tr>
                    <td colSpan={6} className="border-t border-ink-800 bg-ink-950/60 px-4 py-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Reason</p>
                          <p className="mt-1 text-sm text-slate-300">{c.reason}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Supporting evidence</p>
                          <p className="mt-1 text-sm text-slate-300">{c.supporting_evidence}</p>
                        </div>
                        {evidence && (
                          <div className="sm:col-span-2 rounded-md border border-teal-800/50 bg-teal-500/5 p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-teal-400">
                              Source: {evidence.document_source}
                            </p>
                            <p className="mt-1 text-sm text-slate-200">"{evidence.quoted_finding}"</p>
                            <p className="mt-1 text-xs text-slate-400">{evidence.justification}</p>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
