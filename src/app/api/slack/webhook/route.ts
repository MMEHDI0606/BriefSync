import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const payloadText = rawBody.startsWith("payload=") ? decodeURIComponent(rawBody.slice(8)) : rawBody;

  try {
    const payload = JSON.parse(payloadText);
    const action = payload?.actions?.[0]?.action_id;
    const value = payload?.actions?.[0]?.value;

    if (action === "wrong_recipient") {
      console.info("Slack wrong recipient feedback", { itemId: value, user: payload?.user?.id });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
