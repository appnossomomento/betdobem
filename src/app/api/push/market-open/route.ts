import { NextResponse } from "next/server";
import { dispatchKind } from "@/lib/push";
import { saoPauloHour } from "@/lib/market";
import { getRound } from "@/lib/round";
import { kickoffDay } from "@/lib/market";

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  if (saoPauloHour() < 8) return NextResponse.json({ ok: true, skipped: "cedo" });
  const round = await getRound();
  const today = round.games.some((game) => !game.finished && kickoffDay(game.kickoff) === "today");
  if (!today) return NextResponse.json({ ok: true, skipped: "dia" });
  const result = await dispatchKind("mercado_aberto");
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  return GET(request);
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
