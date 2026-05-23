import { ExtractedItem, MeetingRun } from "@/lib/types";

function ensureNotionConfig(): { apiKey: string; meetingsDb: string; tasksDb: string } {
  const apiKey = process.env.NOTION_API_KEY;
  const meetingsDb = process.env.NOTION_MEETINGS_DATABASE_ID;
  const tasksDb = process.env.NOTION_TASKS_DATABASE_ID;

  if (!apiKey || !meetingsDb || !tasksDb) {
    throw new Error("Notion config missing. Set NOTION_API_KEY, NOTION_MEETINGS_DATABASE_ID, and NOTION_TASKS_DATABASE_ID.");
  }

  return { apiKey, meetingsDb, tasksDb };
}

async function notionRequest(path: string, init: RequestInit): Promise<any> {
  const { apiKey } = ensureNotionConfig();

  const response = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Notion API error (${response.status}): ${text}`);
  }

  return response.json();
}

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (error) {
      attempt += 1;
      if (attempt >= maxRetries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }

  throw new Error("Unexpected retry state");
}

export async function createMeetingSummaryPage(run: MeetingRun): Promise<string> {
  const { meetingsDb } = ensureNotionConfig();

  const payload = {
    parent: { database_id: meetingsDb },
    properties: {
      Name: {
        title: [{ text: { content: `${run.meeting_name} - ${new Date(run.created_at).toISOString().slice(0, 10)}` } }],
      },
      Date: { date: { start: run.created_at } },
      Participants: { rich_text: [{ text: { content: run.items.map((i) => i.owner_name).filter(Boolean).join(", ") } }] },
      "Action Item Count": { number: run.items.length },
      "Transcript Source": { rich_text: [{ text: { content: "User Input" } }] },
      Status: { select: { name: "Processed" } },
    },
  };

  const result = await withRetry(() => notionRequest("/pages", { method: "POST", body: JSON.stringify(payload) }));
  return result.id;
}

export async function createActionItemEntry(item: ExtractedItem, summaryPageId: string): Promise<string> {
  const { tasksDb } = ensureNotionConfig();

  const payload: Record<string, unknown> = {
    parent: { database_id: tasksDb },
    properties: {
      Name: { title: [{ text: { content: item.description.slice(0, 200) } }] },
      Priority: { select: { name: item.priority[0].toUpperCase() + item.priority.slice(1) } },
      Status: { select: { name: "Not Started" } },
      Meeting: { relation: [{ id: summaryPageId }] },
      "Raw Quote": { rich_text: [{ text: { content: item.raw_quote.slice(0, 1800) } }] },
      Confidence: { number: item.confidence },
      Notes: { rich_text: [{ text: { content: item.confidence_reason } }] },
    },
  };

  if (item.deadline) {
    (payload.properties as any).Deadline = { date: { start: item.deadline } };
  }

  const result = await withRetry(() => notionRequest("/pages", { method: "POST", body: JSON.stringify(payload) }));
  return result.id;
}

export function notionPageUrl(pageId: string): string {
  return `https://notion.so/${pageId.replace(/-/g, "")}`;
}
