"use client";

import { CheckCircle2, Loader2, CircleDashed, AlertTriangle } from "lucide-react";
import type { AgentTimelineEvent } from "@/lib/types";

const ALL_AGENTS = [
  "Agent 1: Document Intake",
  "Agent 2: Clinical Extraction",
  "Agent 3: Medical Coding",
  "Agent 4: Medical Billing",
  "Agent 5: Compliance",
  "Agent 6: Independent Audit",
  "Agent 8: Evidence Verification",
  "Agent 7: Final Decision",
];

export default function AgentTimeline({ events }: { events: AgentTimelineEvent[] }) {
  const byAgent = new Map(events.map((e) => [e.agent, e]));

  return (
    <ol className="flex flex-col gap-0">
      {ALL_AGENTS.map((agentName, idx) => {
        const event = byAgent.get(agentName);
        const status = event?.status ?? "pending";
        return (
          <li key={agentName} className="relative flex gap-3 pb-6 last:pb-0">
            {idx < ALL_AGENTS.length - 1 && (
              <span
                className="absolute left-[11px] top-6 h-full w-px bg-ink-700"
                aria-hidden
              />
            )}
            <div className="z-10 mt-0.5 shrink-0">
              {status === "complete" && <CheckCircle2 className="h-6 w-6 text-teal-400" />}
              {status === "running" && (
                <Loader2 className="h-6 w-6 animate-spin text-amber-400" />
              )}
              {status === "error" && <AlertTriangle className="h-6 w-6 text-red-400" />}
              {status === "pending" && <CircleDashed className="h-6 w-6 text-slate-600" />}
            </div>
            <div className="min-w-0">
              <p
                className={`font-display text-sm font-medium ${
                  status === "pending" ? "text-slate-500" : "text-slate-100"
                }`}
              >
                {agentName}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                {event?.message ?? "Waiting…"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
