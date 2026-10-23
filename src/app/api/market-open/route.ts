import { NextResponse } from "next/server";
import { ensureMarketNotice } from "@/lib/market-notice";
import { runPushClock } from "@/lib/push-clock";

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  await ensureMarketNotice();
  const push = await runPushClock().catch(() => ({ ok: false as const }));
  return NextResponse.json({ ok: true, push });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
