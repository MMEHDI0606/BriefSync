"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [csv, setCsv] = useState("name,aliases,slack_id,notion_user_id\nAhmed Raza,Ahmed|Maz,U012AB3CD,");
  const [result, setResult] = useState<string>("");

  async function uploadDirectory() {
    setResult("Saving...");
    try {
      const res = await fetch("/api/settings/directory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult(`Error: ${data.error || "Unknown error"}`);
        return;
      }

      setResult(`Saved ${data.count} team members.`);
    } catch {
      setResult("Failed to save directory.");
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
      <p className="mt-1 text-sm text-slate-600">
        Provide your team directory now. External credentials (Gemini, Notion, Slack) are read from environment variables.
      </p>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Team Directory CSV</h2>
        <p className="mt-1 text-xs text-slate-500">Columns: name,aliases,slack_id,notion_user_id</p>

        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          className="mt-3 min-h-56 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />

        <button
          type="button"
          onClick={uploadDirectory}
          className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white"
        >
          Save Directory
        </button>
        {!!result && <p className="mt-2 text-sm text-slate-700">{result}</p>}
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <h2 className="text-lg font-semibold text-slate-900">Environment Keys Needed</h2>
        <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
          <li>GEMINI_API_KEY</li>
          <li>NOTION_API_KEY</li>
          <li>NOTION_MEETINGS_DATABASE_ID</li>
          <li>NOTION_TASKS_DATABASE_ID</li>
          <li>SLACK_BOT_TOKEN</li>
          <li>SLACK_SIGNING_SECRET</li>
        </ul>
      </section>
    </main>
  );
}
