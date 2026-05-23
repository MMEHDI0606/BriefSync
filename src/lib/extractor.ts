import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExtractionResult, ExtractedItem } from "@/lib/types";
import { clamp01, makeId, parseDateLoose } from "@/lib/utils";

const SYSTEM_PROMPT = `You are a meeting analyst. Return valid JSON only.\n\nReturn exactly this JSON shape:\n{\n  "action_items": [{\n    "description": "string",\n    "raw_quote": "string",\n    "owner_name": "string|null",\n    "deadline": "ISO8601|null",\n    "priority": "high|medium|low",\n    "confidence": 0.0,\n    "confidence_reason": "string"\n  }],\n  "decisions": ["string"],\n  "open_questions": ["string"],\n  "blockers": ["string"]\n}`;

const geminiApiKey = process.env.GEMINI_API_KEY;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;
const model = genAI
  ? genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    })
  : null;

function safeParseJson(text: string): ExtractionResult | null {
  try {
    return JSON.parse(text) as ExtractionResult;
  } catch {
    const stripped = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(stripped) as ExtractionResult;
    } catch {
      return null;
    }
  }
}

function logRawResponse(label: string, rawText: string): void {
  console.error(label);
  console.error(rawText);
}

function inferPriority(line: string): ExtractedItem["priority"] {
  if (/asap|urgent|today|critical|before/i.test(line)) return "high";
  if (/this week|soon|tomorrow|next/i.test(line)) return "medium";
  return "low";
}

function heuristicExtract(cleanedText: string): ExtractionResult {
  const lines = cleanedText.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  const actionItems: ExtractionResult["action_items"] = [];
  const decisions: string[] = [];
  const openQuestions: string[] = [];
  const blockers: string[] = [];

  for (const line of lines) {
    if (/\?$/.test(line) || /open question|unsure|not clear/i.test(line)) {
      openQuestions.push(line);
      continue;
    }

    if (/decided|decision|we agreed|agreed/i.test(line)) {
      decisions.push(line);
      continue;
    }

    if (/blocked|blocker|waiting on|dependency/i.test(line)) {
      blockers.push(line);
      continue;
    }

    if (/\b(will|needs to|action|todo|follow up|send|create|update|review|deliver|prepare)\b/i.test(line)) {
      const ownerMatch = line.match(/^([A-Za-z][A-Za-z0-9 ._-]{1,30}):/);
      actionItems.push({
        description: line.replace(/^([A-Za-z][A-Za-z0-9 ._-]{1,30}):\s*/, ""),
        raw_quote: line,
        owner_name: ownerMatch ? ownerMatch[1] : null,
        deadline: parseDateLoose(line),
        priority: inferPriority(line),
        confidence: 0.72,
        confidence_reason: "Heuristic extraction fallback used due missing LLM credentials.",
      });
    }
  }

  return {
    action_items: actionItems,
    decisions,
    open_questions: openQuestions,
    blockers,
    needs_human_review: false,
    failure_reason: null,
  };
}

async function geminiExtract(cleanedText: string, participants: string[], meetingName: string): Promise<ExtractionResult | null> {
  if (!model) {
    return null;
  }

  const prompt = `\n${SYSTEM_PROMPT}\n\nParticipants: ${participants.join(", ")}\nMeeting name: ${meetingName}\n\nTranscript:\n${cleanedText}\n`;

  let lastRawText = "";
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const result = await model.generateContent({
        contents: [
          { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
          { role: "user", parts: [{ text: prompt }] },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      });

      const text = result.response.text();
      lastRawText = text;
      const parsed = safeParseJson(text);

      if (parsed) {
        return parsed;
      }

      logRawResponse(`Gemini parse failure on attempt ${attempt}; raw response text follows:`, text);
    } catch (error) {
      lastError = error;
      const rawText = lastRawText || (error instanceof Error ? error.message : String(error));
      logRawResponse(`Gemini generateContent failure on attempt ${attempt}; raw response text follows:`, rawText);
    }
  }

  if (lastError) {
    console.error("Gemini extraction failed after 3 attempts; escalating to human review.");
  }

  return null;
}

export async function extractFromTranscript(
  cleanedText: string,
  participants: string[],
  meetingName: string,
): Promise<ExtractionResult> {
  const llmResult = await geminiExtract(cleanedText, participants, meetingName);

  if (llmResult) {
    return {
      ...llmResult,
      needs_human_review: false,
      failure_reason: null,
    };
  }

  return {
    ...heuristicExtract(cleanedText),
    needs_human_review: true,
    failure_reason: "Gemini parse failure after 3 attempts; human review required.",
  };
}

export function toExtractedItems(actionItems: ExtractionResult["action_items"]): ExtractedItem[] {
  return actionItems.map((item) => ({
    id: makeId("item"),
    type: "action_item",
    description: item.description,
    raw_quote: item.raw_quote,
    owner_name: item.owner_name,
    owner_slack_id: null,
    owner_notion_id: null,
    deadline: item.deadline,
    priority: item.priority,
    confidence: clamp01(item.confidence),
    confidence_reason: item.confidence_reason,
    escalation_flag: false,
    escalation_reason: null,
    execution_status: "pending",
    notion_page_id: null,
    slack_message_ts: null,
  }));
}
