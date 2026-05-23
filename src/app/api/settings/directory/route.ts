import { NextRequest, NextResponse } from "next/server";
import { parseDirectoryCsv } from "@/lib/directory";
import { setDirectory } from "@/lib/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const csv = (body?.csv || "") as string;
    const members = parseDirectoryCsv(csv);
    setDirectory(members);
    return NextResponse.json({ count: members.length, members });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to parse directory" },
      { status: 400 },
    );
  }
}
