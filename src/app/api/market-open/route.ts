import { NextResponse } from "next/server";
import { ensureMarketNotice } from "@/lib/market-notice";

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  await ensureMarketNotice();
  return NextResponse.json({ ok: true });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
