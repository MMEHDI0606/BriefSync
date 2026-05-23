"use client";

import { useEffect, useState } from "react";
import { MeetingRun } from "@/lib/types";

export default function HistoryPage() {
  const [runs, setRuns] = useState<MeetingRun[]>([]);

  useEffect(() => {
    void fetch("/api/runs")
      .then((res) => res.json())
      .then((data) => setRuns(data.runs || []))
      .catch(() => setRuns([]));
  }, []);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Run History</h1>
      <p className="mt-1 text-sm text-slate-600">Recent transcript processing runs from this server session.</p>

      <div className="mt-6 space-y-3">
        {runs.length === 0 && <p className="text-sm text-slate-500">No runs yet.</p>}
        {runs.map((run) => (
          <article key={run.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-semibold text-slate-900">{run.meeting_name}</h2>
              <span className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{run.status}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{new Date(run.created_at).toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-700">
              Items: {run.items.length} | Escalated: {run.escalation_count} | Auto: {run.auto_resolved_count}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
