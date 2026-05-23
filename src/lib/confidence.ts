import { EscalationItem, ExtractedItem, TeamMember } from "@/lib/types";
import { resolveTeamMember } from "@/lib/directory";
import { makeId } from "@/lib/utils";

const HIGH_STAKES = ["budget", "contract", "legal", "payment", "lawsuit", "terminate", "fire"];

export function routeItem(item: ExtractedItem, directory: TeamMember[]): ExtractedItem {
  const flags: string[] = [];

  if (item.confidence < 0.7) {
    flags.push(`Low extraction confidence: ${item.confidence.toFixed(2)}`);
  }

  if (item.owner_name) {
    const resolved = resolveTeamMember(item.owner_name, directory);
    if (!resolved) {
      flags.push(`Owner '${item.owner_name}' not found in team directory`);
    } else {
      item.owner_slack_id = resolved.slack_id;
      item.owner_notion_id = resolved.notion_user_id;
    }
  }

  if (HIGH_STAKES.some((kw) => item.description.toLowerCase().includes(kw))) {
    flags.push("High-stakes language detected - human review required");
  }

  if (/ambiguous|two names|multiple owners/i.test(item.confidence_reason)) {
    flags.push("Ambiguous owner assignment");
  }

  if (!item.deadline && /soon|asap|this week|by end of/i.test(item.description)) {
    flags.push("Implied deadline - confirm date");
  }

  if (flags.length) {
    item.escalation_flag = true;
    item.escalation_reason = flags.join("; ");
    item.execution_status = "escalated";
  }

  return item;
}

export function splitItems(items: ExtractedItem[], directory: TeamMember[]): {
  autoExecute: ExtractedItem[];
  escalated: EscalationItem[];
} {
  const autoExecute: ExtractedItem[] = [];
  const escalated: EscalationItem[] = [];

  for (const source of items) {
    const item = routeItem({ ...source }, directory);
    if (item.escalation_flag) {
      escalated.push({
        id: makeId("esc"),
        item,
        reason: item.escalation_reason || "Requires review",
        recommended_action: item.owner_name ? `Confirm assignment to ${item.owner_name}` : "Assign owner",
        options: ["Assign", "Skip", "Ask in thread"],
        resolved: false,
        resolution: null,
      });
    } else {
      autoExecute.push(item);
    }
  }

  return { autoExecute, escalated };
}
