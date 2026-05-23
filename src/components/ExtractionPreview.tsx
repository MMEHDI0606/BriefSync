"use client";

import { ExtractedItem } from "@/lib/types";

interface ExtractionPreviewProps {
  items: ExtractedItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}

function confidenceColor(conf: number): string {
  if (conf >= 0.85) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (conf >= 0.7) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-rose-700 bg-rose-50 border-rose-200";
}

export function ExtractionPreview({ items, selectedIds, onToggle }: ExtractionPreviewProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Extraction Preview</h2>
      <div className="mt-4 space-y-3">
        {items.map((item) => {
          const selected = selectedIds.includes(item.id);
          return (
            <article key={item.id} className="rounded-lg border border-slate-200 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <input type="checkbox" checked={selected} onChange={() => onToggle(item.id)} />
                  {item.description}
                </label>
                <span className={`rounded-full border px-2 py-1 text-xs ${confidenceColor(item.confidence)}`}>
                  {(item.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-600">Owner: {item.owner_name || "Unassigned"}</p>
              <p className="text-xs text-slate-600">Deadline: {item.deadline || "Not set"}</p>
              <p className="text-xs text-slate-600">Priority: {item.priority}</p>
              <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-700">"{item.raw_quote}"</p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
