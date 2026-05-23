import { ExtractedItem } from "@/lib/types";

function ensureSlackConfig(): { token: string } {
  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("Slack config missing. Set SLACK_BOT_TOKEN.");
  }
  return { token };
}

export function buildDMText(item: ExtractedItem, meetingName: string, notionUrl: string): string {
  return `From ${meetingName}:\n- ${item.description}\nDeadline: ${item.deadline || "Not set"}\nPriority: ${item.priority}\n${notionUrl}`;
}

export async function sendTaskDM(item: ExtractedItem, meetingName: string, notionUrl: string): Promise<string> {
  const { token } = ensureSlackConfig();
  if (!item.owner_slack_id) {
    throw new Error("owner_slack_id missing for DM send");
  }

  const payload = {
    channel: item.owner_slack_id,
    text: buildDMText(item, meetingName, notionUrl),
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `Hey <@${item.owner_slack_id}>\n\n*${meetingName}*\n• ${item.description}\n• Deadline: ${item.deadline || "Not set"}\n• Priority: ${item.priority.toUpperCase()}`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View in Notion" },
            url: notionUrl,
          },
          {
            type: "button",
            text: { type: "plain_text", text: "This wasn't meant for me" },
            value: item.id,
            action_id: "wrong_recipient",
          },
        ],
      },
    ],
  };

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data.ts as string;
}
