import { NextResponse } from "next/server";
import { runPushClock } from "@/lib/push-clock";
import { refreshLiveRound } from "@/lib/round";
import { settleOpenBets } from "@/lib/settle";

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  await refreshLiveRound().catch(() => null);
  const settled = await settleOpenBets();
  const push = await runPushClock().catch(() => ({ ok: false as const }));
  return NextResponse.json({ ok: true, settled, push });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
