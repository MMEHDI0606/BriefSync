"use client";

interface TranscriptInputProps {
  transcript: string;
  meetingName: string;
  onTranscriptChange: (value: string) => void;
  onMeetingNameChange: (value: string) => void;
  onFileChange: (file: File | null) => void;
  onProcess: () => void;
  busy: boolean;
}

export function TranscriptInput({
  transcript,
  meetingName,
  onTranscriptChange,
  onMeetingNameChange,
  onFileChange,
  onProcess,
  busy,
}: TranscriptInputProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Transcript Input</h2>
      <p className="mt-1 text-sm text-slate-600">Paste meeting text or upload .txt/.vtt, then run processing.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-[2fr_1fr]">
        <textarea
          value={transcript}
          onChange={(e) => onTranscriptChange(e.target.value)}
          placeholder="Paste transcript here..."
          className="min-h-60 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
        />
        <div className="space-y-3">
          <input
            value={meetingName}
            onChange={(e) => onMeetingNameChange(e.target.value)}
            placeholder="Meeting name (optional)"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500"
          />

          <label className="block rounded-lg border border-dashed border-slate-300 p-3 text-sm text-slate-600">
            Upload .txt / .vtt
            <input
              type="file"
              accept=".txt,.vtt"
              className="mt-2 block w-full text-xs"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
            />
          </label>

          <button
            type="button"
            onClick={onProcess}
            disabled={busy || !transcript.trim()}
            className="w-full rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {busy ? "Processing..." : "Process Transcript"}
          </button>
        </div>
      </div>
    </section>
  );
}
