"use client";

import { useMemo, useState } from "react";
import { EscalationQueue } from "@/components/EscalationQueue";
import { ExtractionPreview } from "@/components/ExtractionPreview";
import { RunSummary } from "@/components/RunSummary";
import { StatusTracker } from "@/components/StatusTracker";
import { TranscriptInput } from "@/components/TranscriptInput";
import { EscalationItem, ExtractedItem } from "@/lib/types";

interface ProcessResponse {
  run: { id: string };
  auto_execute: ExtractedItem[];
  escalation_queue: EscalationItem[];
  warning: string | null;
}

interface ExecuteResponse {
  runId: string;
  summaryUrl: string | null;
  report: Array<{ status: string }>;
}

export default function Home() {
  const [transcript, setTranscript] = useState("");
  const [meetingName, setMeetingName] = useState("");
  const [status, setStatus] = useState<"idle" | "processing" | "ready" | "executing" | "complete" | "error">("idle");
  const [runId, setRunId] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [items, setItems] = useState<ExtractedItem[]>([]);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [summaryUrl, setSummaryUrl] = useState<string | null>(null);
  const [executeStats, setExecuteStats] = useState({ executed: 0, failed: 0, skipped: 0 });

  const busy = status === "processing" || status === "executing";

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  async function handleFileChange(file: File | null) {
    if (!file) return;
    const text = await file.text();
    setTranscript(text);
    if (!meetingName) {
      setMeetingName(file.name.replace(/\.[a-z0-9]+$/i, ""));
    }
  }

  function toggleItem(id: string) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  async function processTranscript() {
    setStatus("processing");
    setWarning(null);
    setSummaryUrl(null);

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, meetingName }),
      });

      const data = (await res.json()) as ProcessResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Processing failed");
      }

      const merged = [...data.auto_execute, ...data.escalation_queue.map((e) => e.item)];
      setRunId(data.run.id);
      setItems(merged);
      setEscalations(data.escalation_queue);
      setSelectedIds(merged.map((i) => i.id));
      setWarning(data.warning || null);
      setStatus("ready");
    } catch (error) {
      setStatus("error");
      setWarning(error instanceof Error ? error.message : "Failed to process transcript");
    }
  }

  async function executeSelected() {
    if (!runId) return;

    setStatus("executing");
    try {
      const skipped = items.filter((i) => !selectedSet.has(i.id)).map((i) => i.id);
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, approvedItemIds: selectedIds, skippedItemIds: skipped }),
      });

      const data = (await res.json()) as ExecuteResponse & { error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Execution failed");
      }

      const executed = data.report.filter((r) => r.status === "executed").length;
      const failed = data.report.filter((r) => r.status === "failed").length;
      const skippedCount = data.report.filter((r) => r.status === "skipped").length;

      setExecuteStats({ executed, failed, skipped: skippedCount });
      setSummaryUrl(data.summaryUrl);
      setStatus("complete");
    } catch (error) {
      setStatus("error");
      setWarning(error instanceof Error ? error.message : "Execution failed");
    }
  }

  return (
    <main className="relative mx-auto w-full max-w-6xl px-4 py-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,#ccfbf1_0,transparent_45%),radial-gradient(circle_at_bottom_right,#ddd6fe_0,transparent_38%)] opacity-80" />

      <header className="mb-6 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">BriefSync</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-700">
          Turn meeting transcripts into action items, escalation queues, and execution artifacts for Notion and Slack.
        </p>
      </header>

      <div className="space-y-5">
        <StatusTracker status={status} />
        <TranscriptInput
          transcript={transcript}
          meetingName={meetingName}
          onTranscriptChange={setTranscript}
          onMeetingNameChange={setMeetingName}
          onFileChange={handleFileChange}
          onProcess={processTranscript}
          busy={busy}
        />

        {warning && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {warning}
          </div>
        )}

        <ExtractionPreview items={items} selectedIds={selectedIds} onToggle={toggleItem} />
        <EscalationQueue escalations={escalations} />

        {items.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <button
              type="button"
              disabled={busy}
              onClick={executeSelected}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {status === "executing" ? "Executing..." : "Execute Selected Items"}
            </button>
          </div>
        )}

        <RunSummary
          runId={runId}
          summaryUrl={summaryUrl}
          executed={executeStats.executed}
          failed={executeStats.failed}
          skipped={executeStats.skipped}
        />
      </div>
    </main>
  );
}
