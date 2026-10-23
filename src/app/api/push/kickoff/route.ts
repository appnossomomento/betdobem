import { NextResponse } from "next/server";
import { dispatchKind } from "@/lib/push";
import { kickoffDay, marketOpen } from "@/lib/market";
import { getRound } from "@/lib/round";

const minute = 60_000;

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const round = await getRound();
  const first = round.games
    .filter((game) => !game.finished && kickoffDay(game.kickoff) === "today")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
  if (!first) return NextResponse.json({ ok: true, skipped: "dia" });
  const kick = Date.parse(first.kickoff);
  const closeAt = kick - minute;
  const sendAt = closeAt - 15 * minute;
  const now = Date.now();
  if (now < sendAt || now >= closeAt || !marketOpen(first.kickoff, now)) return NextResponse.json({ ok: true, skipped: "janela" });
  const result = await dispatchKind("partidas_iniciando");
  return NextResponse.json(result);
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
