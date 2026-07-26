"use client";

import { useState } from "react";
import { Stethoscope, Sparkles, BarChart3 } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import AgentTimeline from "@/components/AgentTimeline";
import ReportView from "@/components/ReportView";
import { analyzeDocuments } from "@/lib/api";
import type { PipelineResult } from "@/lib/types";
import Link from "next/link";

export default function HomePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const res = await analyzeDocuments(files);
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-ink-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-teal-500/10 p-2">
            <Stethoscope className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-50">Amjad Healthcare AI</h1>
            <p className="text-xs text-slate-500">Multi-agent medical coding &amp; audit platform</p>
          </div>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-600 hover:text-teal-300"
        >
          <BarChart3 className="h-3.5 w-3.5" /> Performance Dashboard
        </Link>
      </header>

      {!result && (
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-slate-50">
              An entire coding department, in one upload.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Upload progress notes, operative reports, radiology or lab results, discharge summaries, or
              insurance documents. Nine specialized agents extract, code, bill, audit, and verify — with
              every code traced back to its source evidence.
            </p>
          </div>

          <FileUpload files={files} onChange={setFiles} disabled={analyzing} />

          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || analyzing}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-teal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>

          {error && (
            <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {analyzing && (
            <div className="mt-10 rounded-lg border border-ink-700 bg-ink-900/40 p-6">
              <h3 className="font-display mb-6 text-sm font-medium text-slate-200">Agent Activity</h3>
              <AgentTimeline events={[]} />
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal-400" />
                Running full pipeline — this typically takes 30–90 seconds depending on document volume.
              </p>
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="mt-10">
          <button
            onClick={() => {
              setResult(null);
              setFiles([]);
            }}
            className="mb-6 text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            ← Analyze new documents
          </button>
          <ReportView result={result} />
        </section>
      )}
    </div>
  );
}
