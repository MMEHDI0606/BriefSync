import { NextRequest, NextResponse } from "next/server";
import { splitItems } from "@/lib/confidence";
import { extractFromTranscript, toExtractedItems } from "@/lib/extractor";
import { preprocessTranscript } from "@/lib/preprocessor";
import { getDirectory, saveRun } from "@/lib/store";
import { makeId } from "@/lib/utils";
import { EscalationItem, MeetingRun } from "@/lib/types";

interface ProcessBody {
  transcript: string;
  meetingName?: string;
  fileName?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProcessBody;
    if (!body.transcript?.trim()) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    const prep = preprocessTranscript(body.transcript, body.fileName, body.meetingName);
    const extraction = await extractFromTranscript(prep.cleaned_text, prep.participants, prep.meeting_name);
    const items = toExtractedItems(extraction.action_items);

    const directory = getDirectory();
    const reviewForced = Boolean(extraction.needs_human_review);
    const reviewItems = reviewForced
      ? items.map((item) => ({
          ...item,
          escalation_flag: true,
          escalation_reason: extraction.failure_reason || "Human review required",
          confidence: 0,
        }))
      : items;

    const { autoExecute, escalated } = splitItems(reviewItems, directory);

    const finalEscalations: EscalationItem[] = reviewForced
      ? escalated.length > 0
        ? escalated
        : [
            {
              id: makeId("esc"),
              item: {
                id: makeId("item"),
                type: "action_item",
                description: "Gemini extraction failed and requires human review.",
                raw_quote: prep.cleaned_text.slice(0, 500),
                owner_name: null,
                owner_slack_id: null,
                owner_notion_id: null,
                deadline: null,
                priority: "low",
                confidence: 0,
                confidence_reason: extraction.failure_reason || "Gemini extraction failure.",
                escalation_flag: true,
                escalation_reason: extraction.failure_reason || "Gemini extraction failure.",
                execution_status: "escalated",
                notion_page_id: null,
                slack_message_ts: null,
              },
              reason: extraction.failure_reason || "Gemini extraction failure.",
              recommended_action: "Review the transcript manually and rerun processing.",
              options: ["Review transcript", "Skip", "Ask in thread"],
              resolved: false,
              resolution: null,
            },
          ]
      : escalated;

    const run: MeetingRun = {
      id: makeId("run"),
      created_at: new Date().toISOString(),
      meeting_name: prep.meeting_name,
      raw_transcript: body.transcript,
      cleaned_transcript: prep.cleaned_text,
      items,
      decisions: extraction.decisions,
      open_questions: extraction.open_questions,
      blockers: extraction.blockers,
      escalation_count: finalEscalations.length,
      auto_resolved_count: autoExecute.length,
      notion_summary_page_id: null,
      status: finalEscalations.length ? "awaiting_review" : "executing",
    };

    saveRun(run);

    return NextResponse.json({
      run,
      preprocessor: prep,
      decisions: extraction.decisions,
      open_questions: extraction.open_questions,
      blockers: extraction.blockers,
      auto_execute: autoExecute,
      escalation_queue: finalEscalations,
      warning: prep.too_short_flag ? "Transcript appears short (<200 words)." : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown processing error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
