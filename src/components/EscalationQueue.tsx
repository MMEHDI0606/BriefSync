"use client";

import { EscalationItem } from "@/lib/types";

interface EscalationQueueProps {
  escalations: EscalationItem[];
}

export function EscalationQueue({ escalations }: EscalationQueueProps) {
  if (!escalations.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-amber-900">Escalation Queue</h2>
      <div className="mt-4 space-y-3">
        {escalations.map((e) => (
          <article key={e.id} className="rounded-lg border border-amber-200 bg-white p-3">
            <p className="text-sm font-semibold text-slate-900">{e.item.description}</p>
            <p className="mt-1 text-xs text-amber-800">Reason: {e.reason}</p>
            <p className="mt-1 text-xs text-slate-600">Recommended: {e.recommended_action}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {e.options.map((opt) => (
                <button key={opt} type="button" className="rounded border border-amber-300 px-2 py-1 text-xs text-amber-900">
                  {opt}
                </button>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
