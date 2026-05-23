import path from "path";
import { config as loadEnv } from "dotenv";
import { Client } from "@notionhq/client";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is missing from .env.local`);
  }
  return value;
}

const notionApiKey = requireEnv("NOTION_API_KEY");
const notionParentPageId = requireEnv("NOTION_PARENT_PAGE_ID");

const notion = new Client({ auth: notionApiKey });

async function createMeetingsDatabase(): Promise<{ databaseId: string; dataSourceId: string }> {
  const payload: any = {
    parent: { type: "page_id", page_id: notionParentPageId },
    title: [{ type: "text", text: { content: "BriefSync — Meetings" } }],
    initial_data_source: {
      properties: {
        Name: { title: {} },
        Date: { date: {} },
        Participants: { rich_text: {} },
        "Action Item Count": { number: { format: "number" } },
        "Transcript Source": {
          select: {
            options: [
              { name: "Zoom", color: "blue" },
              { name: "Otter", color: "green" },
              { name: "Plain text", color: "gray" },
            ],
          },
        },
        Status: {
          select: {
            options: [
              { name: "Processed", color: "green" },
              { name: "Executing", color: "yellow" },
              { name: "Complete", color: "blue" },
            ],
          },
        },
      },
    },
  };

  const result = (await notion.databases.create(payload)) as any;
  return {
    databaseId: result.id,
    dataSourceId: result.data_sources[0]?.id ?? result.id,
  };
}

async function createTasksDatabase(): Promise<{ databaseId: string; dataSourceId: string }> {
  const payload: any = {
    parent: { type: "page_id", page_id: notionParentPageId },
    title: [{ type: "text", text: { content: "BriefSync — Tasks" } }],
    initial_data_source: {
      properties: {
        Name: { title: {} },
        Deadline: { date: {} },
        Priority: {
          select: {
            options: [
              { name: "High", color: "red" },
              { name: "Medium", color: "yellow" },
              { name: "Low", color: "green" },
            ],
          },
        },
        Status: {
          select: {
            options: [
              { name: "Not Started", color: "gray" },
              { name: "In Progress", color: "yellow" },
              { name: "Done", color: "green" },
            ],
          },
        },
        "Raw Quote": { rich_text: {} },
        Confidence: { number: { format: "number" } },
        "Owner Name": { rich_text: {} },
      },
    },
  };

  const result = (await notion.databases.create(payload)) as any;
  return {
    databaseId: result.id,
    dataSourceId: result.data_sources[0]?.id ?? result.id,
  };
}

async function main() {
  const meetingsDatabase = await createMeetingsDatabase();
  const tasksDatabase = await createTasksDatabase();

  await notion.dataSources.update({
    data_source_id: tasksDatabase.dataSourceId,
    properties: {
      Meeting: {
        relation: {
          data_source_id: meetingsDatabase.dataSourceId,
          type: "single_property",
          single_property: {},
        },
      },
    },
  } as any);

  console.log(`NOTION_MEETINGS_DATABASE_ID=${meetingsDatabase.databaseId}`);
  console.log(`NOTION_TASKS_DATABASE_ID=${tasksDatabase.databaseId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
