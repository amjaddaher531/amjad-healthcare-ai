import clsx from "clsx";
import type { RiskLevel } from "@/lib/types";

export function RiskBadge({ level }: { level: RiskLevel }) {
  const styles: Record<RiskLevel, string> = {
    LOW: "bg-teal-500/10 text-teal-300 border-teal-500/30",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    HIGH: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  return (
    <span className={clsx("rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide", styles[level])}>
      {level}
    </span>
  );
}

export function ConfidenceBar({ score }: { score: number }) {
  const color = score >= 85 ? "bg-teal-400" : score >= 60 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-800">
        <div className={clsx("h-full rounded-full", color)} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
      </div>
      <span className="font-mono-code text-xs text-slate-400">{score.toFixed(0)}%</span>
    </div>
  );
}
