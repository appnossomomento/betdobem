import { NextResponse } from "next/server";
import { sendMorningIfDue } from "@/lib/push-clock";

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  return NextResponse.json(await sendMorningIfDue());
}

export async function POST(request: Request) {
  return GET(request);
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
