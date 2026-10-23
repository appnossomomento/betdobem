import { NextResponse } from "next/server";
import { settleOpenBets } from "@/lib/settle";

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const settled = await settleOpenBets();
  return NextResponse.json({ ok: true, settled });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
