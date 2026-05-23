export type Priority = "high" | "medium" | "low";
export type ItemType = "action_item" | "decision" | "open_question" | "blocker";
export type ExecutionStatus =
  | "pending"
  | "escalated"
  | "approved"
  | "executed"
  | "failed"
  | "skipped";

export interface ExtractedItem {
  id: string;
  type: ItemType;
  description: string;
  raw_quote: string;
  owner_name: string | null;
  owner_slack_id: string | null;
  owner_notion_id: string | null;
  deadline: string | null;
  priority: Priority;
  confidence: number;
  confidence_reason: string;
  escalation_flag: boolean;
  escalation_reason: string | null;
  execution_status: ExecutionStatus;
  notion_page_id: string | null;
  slack_message_ts: string | null;
}

export interface TeamMember {
  name: string;
  aliases: string[];
  slack_id: string;
  notion_user_id: string | null;
}

export interface EscalationItem {
  id: string;
  item: ExtractedItem;
  reason: string;
  recommended_action: string;
  options: string[];
  resolved: boolean;
  resolution: string | null;
}

export interface MeetingRun {
  id: string;
  created_at: string;
  meeting_name: string;
  raw_transcript: string;
  cleaned_transcript: string;
  items: ExtractedItem[];
  decisions: string[];
  open_questions: string[];
  blockers: string[];
  escalation_count: number;
  auto_resolved_count: number;
  notion_summary_page_id: string | null;
  status: "processing" | "awaiting_review" | "executing" | "complete" | "failed";
}

export interface PreprocessResult {
  cleaned_text: string;
  detected_format: "vtt" | "otter" | "zoom" | "plain";
  participants: string[];
  meeting_name: string;
  word_count: number;
  too_short_flag: boolean;
}

export interface ExtractionResult {
  action_items: Array<
    Pick<
      ExtractedItem,
      | "description"
      | "raw_quote"
      | "owner_name"
      | "deadline"
      | "priority"
      | "confidence"
      | "confidence_reason"
    >
  >;
  decisions: string[];
  open_questions: string[];
  blockers: string[];
  needs_human_review?: boolean;
  failure_reason?: string | null;
}
