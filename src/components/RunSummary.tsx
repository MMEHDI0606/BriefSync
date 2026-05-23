"use client";

interface RunSummaryProps {
  runId: string | null;
  summaryUrl: string | null;
  executed: number;
  failed: number;
  skipped: number;
}

export function RunSummary({ runId, summaryUrl, executed, failed, skipped }: RunSummaryProps) {
  if (!runId) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Execution Summary</h2>
      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Executed: {executed}</div>
        <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-900">Failed: {failed}</div>
        <div className="rounded-lg bg-slate-100 p-3 text-sm text-slate-800">Skipped: {skipped}</div>
      </div>
      {summaryUrl && (
        <a href={summaryUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-medium text-teal-700 underline">
          Open Notion Summary
        </a>
      )}
    </section>
  );
}
