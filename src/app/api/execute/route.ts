import { NextRequest, NextResponse } from "next/server";
import { createActionItemEntry, createMeetingSummaryPage, notionPageUrl } from "@/lib/notion";
import { getRun } from "@/lib/store";
import { sendTaskDM } from "@/lib/slack";
import { ExtractedItem } from "@/lib/types";

interface ExecuteBody {
  runId: string;
  approvedItemIds: string[];
  skippedItemIds?: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ExecuteBody;
    const run = getRun(body.runId);

    if (!run) {
      return NextResponse.json({ error: "Run not found." }, { status: 404 });
    }

    const approvedSet = new Set(body.approvedItemIds || []);
    const skippedSet = new Set(body.skippedItemIds || []);
    const approvedItems = run.items.filter((i) => approvedSet.has(i.id));

    let summaryPageId: string | null = null;
    const report: Array<{ itemId: string; notion?: string; slackTs?: string; status: string; error?: string }> = [];

    if (approvedItems.length > 0) {
      summaryPageId = await createMeetingSummaryPage(run);
    }

    for (const item of run.items) {
      if (skippedSet.has(item.id)) {
        report.push({ itemId: item.id, status: "skipped" });
        continue;
      }

      if (!approvedSet.has(item.id)) {
        report.push({ itemId: item.id, status: "not_approved" });
        continue;
      }

      const mutable = { ...item } as ExtractedItem;

      try {
        const notionId = await createActionItemEntry(mutable, summaryPageId!);
        mutable.notion_page_id = notionId;

        const notionUrl = notionPageUrl(notionId);
        if (mutable.owner_slack_id) {
          const ts = await sendTaskDM(mutable, run.meeting_name, notionUrl);
          mutable.slack_message_ts = ts;
        }

        mutable.execution_status = "executed";
        report.push({ itemId: item.id, notion: mutable.notion_page_id || undefined, slackTs: mutable.slack_message_ts || undefined, status: "executed" });
      } catch (error) {
        mutable.execution_status = "failed";
        report.push({
          itemId: item.id,
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    run.notion_summary_page_id = summaryPageId;
    run.status = "complete";

    return NextResponse.json({
      runId: run.id,
      summaryPageId,
      summaryUrl: summaryPageId ? notionPageUrl(summaryPageId) : null,
      report,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Execution failed" },
      { status: 500 },
    );
  }
}
