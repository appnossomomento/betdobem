import { NextResponse } from "next/server";
import { followLive } from "@/lib/market";
import { refreshLiveRound } from "@/lib/round";
import { settleOpenBets } from "@/lib/settle";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Tick ao vivo: se houver jogo na janela do kickoff, busca ESPN de novo e liquida FT real.
 * Cron a cada minuto; fora da janela só consulta o cache e sai barato.
 */
export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });

  const watching = await hasLiveWindow();
  if (!watching) return NextResponse.json({ ok: true, skipped: true });

  const round = await refreshLiveRound();
  const live = round.games.filter((game) => game.live).length;
  const finished = round.games.filter((game) => game.finished).length;
  const settled = await settleOpenBets().catch(() => 0);
  return NextResponse.json({ ok: true, skipped: false, live, finished, settled });
}

async function hasLiveWindow() {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("fixtures_cache").select("payload").eq("id", "round").maybeSingle();
    const games = (data?.payload as { games?: { kickoff: string; finished: boolean; live: boolean }[] } | null)?.games ?? [];
    const now = Date.now();
    if (!games.length) return true;
    return games.some((game) => followLive(game.kickoff, game.finished, game.live, now));
  } catch {
    return true;
  }
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}
