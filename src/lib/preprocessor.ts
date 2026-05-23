import { PreprocessResult } from "@/lib/types";

const FILLER_PATTERN = /\b(um+|uh+|like|you know|i mean|sort of|kind of)\b/gi;

function detectFormat(raw: string): PreprocessResult["detected_format"] {
  if (/WEBVTT|-->/i.test(raw)) return "vtt";
  if (/\[\d{2}:\d{2}:\d{2}\]/.test(raw)) return "otter";
  if (/\b\d{1,2}:\d{2}:\d{2}\b/.test(raw) && /\n[A-Za-z].*\d{1,2}:\d{2}:\d{2}/.test(raw)) return "zoom";
  return "plain";
}

function stripTimestamps(text: string): string {
  return text
    .replace(/\[\d{2}:\d{2}:\d{2}\]/g, "")
    .replace(/\(\d{2}:\d{2}:\d{2}\)/g, "")
    .replace(/\b\d{1,2}:\d{2}:\d{2}\b\s*-?/g, "")
    .replace(/\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}\.\d{3}/g, "");
}

function normalizeSpeakerLabels(text: string): { normalized: string; participants: string[] } {
  const participants = new Set<string>();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([A-Za-z][A-Za-z0-9 ._-]{1,40})\s*:\s*(.+)$/);
      if (m) {
        const speaker = m[1].trim();
        participants.add(speaker);
        return `${speaker}: ${m[2].trim()}`;
      }
      return line;
    });

  return { normalized: lines.join("\n"), participants: [...participants] };
}

function detectMeetingName(raw: string, fallbackFileName?: string, provided?: string): string {
  if (provided?.trim()) return provided.trim();

  const firstLine = raw.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
  if (firstLine && firstLine.length > 4 && firstLine.length < 80 && !firstLine.includes(":")) {
    return firstLine;
  }

  if (fallbackFileName?.trim()) {
    return fallbackFileName.replace(/\.[a-z0-9]+$/i, "").trim();
  }

  return `Meeting ${new Date().toISOString().slice(0, 10)}`;
}

export function preprocessTranscript(rawText: string, fileName?: string, meetingName?: string): PreprocessResult {
  const format = detectFormat(rawText);
  let cleaned = stripTimestamps(rawText);
  cleaned = cleaned.replace(FILLER_PATTERN, "");
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ").trim();

  const { normalized, participants } = normalizeSpeakerLabels(cleaned);
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;

  return {
    cleaned_text: normalized,
    detected_format: format,
    participants,
    meeting_name: detectMeetingName(rawText, fileName, meetingName),
    word_count: wordCount,
    too_short_flag: wordCount < 200,
  };
}
