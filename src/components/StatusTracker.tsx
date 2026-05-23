interface StatusTrackerProps {
  status: "idle" | "processing" | "ready" | "executing" | "complete" | "error";
}

const STEPS = ["Parsing", "Extracting", "Routing", "Ready for review"];

export function StatusTracker({ status }: StatusTrackerProps) {
  const activeIndex =
    status === "processing" ? 1 : status === "ready" ? 3 : status === "executing" ? 3 : status === "complete" ? 4 : 0;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold tracking-wide text-slate-700">Pipeline Status</h3>
      <div className="mt-3 grid gap-2 md:grid-cols-4">
        {STEPS.map((step, idx) => {
          const done = idx <= activeIndex;
          return (
            <div
              key={step}
              className={`rounded-lg border px-3 py-2 text-sm ${done ? "border-teal-300 bg-teal-50 text-teal-900" : "border-slate-200 bg-slate-50 text-slate-500"}`}
            >
              {step}
            </div>
          );
        })}
      </div>
    </div>
  );
}
