import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { weekKey } from "@/lib/economy";

const slugs = ["bra.1", "conmebol.libertadores", "bra.camp.paulista", "bra.camp.carioca", "bra.camp.mineiro", "bra.camp.gaucho"];

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = createAdminClient();
  const { data: bets } = await admin.from("bets").select("id, user_id, stake, bet_legs(id, fixture_id, selection_key, odd)").eq("status", "open");
  let settled = 0;
  for (const bet of bets ?? []) {
    const legs = (bet.bet_legs ?? []) as { id: string; fixture_id: string; selection_key: string; odd: number }[];
    const results = await Promise.all(legs.map((leg) => finalScore(leg.fixture_id)));
    if (results.some((result) => result == null)) continue;
    const outcomes = legs.map((leg, index) => outcome(leg.selection_key, results[index]!));
    for (let index = 0; index < legs.length; index += 1) {
      await admin.from("bet_legs").update({ result: outcomes[index] }).eq("id", legs[index].id);
    }
    const lost = outcomes.some((item) => item === "lost");
    const allVoid = outcomes.every((item) => item === "void");
    const status = lost ? "lost" : allVoid ? "void" : "won";
    if (status !== "lost") {
      const { data: paid } = await admin.from("ledger").select("id").eq("ref_id", bet.id).in("kind", ["payout", "ajuste"]).limit(1);
      if (!paid?.length) {
        const product = legs.reduce((total, leg, index) => (outcomes[index] === "void" ? total : total * Number(leg.odd)), 1);
        const amount = status === "void" ? Number(bet.stake) : Math.round(Number(bet.stake) * product * 100) / 100;
        await admin.from("ledger").insert({
          user_id: bet.user_id,
          kind: status === "void" ? "ajuste" : "payout",
          amount,
          ref_type: "bet",
          ref_id: bet.id,
          week_key: weekKey(),
        });
      }
    }
    await admin.from("bets").update({ status, settled_at: new Date().toISOString() }).eq("id", bet.id);
    settled += 1;
  }
  return NextResponse.json({ ok: true, settled });
}

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
}

async function finalScore(fixtureId: string) {
  for (const slug of slugs) {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${fixtureId}`, { headers: { "user-agent": "betdobem" } });
    if (!response.ok) continue;
    const body = (await response.json()) as { header?: { competitions?: { status?: { type?: { completed?: boolean; name?: string } }; competitors?: { homeAway?: string; score?: string }[] }[] } };
    const match = body.header?.competitions?.[0];
    if (!match?.competitors?.length) continue;
    const name = match.status?.type?.name ?? "";
    if (name === "STATUS_POSTPONED" || name === "STATUS_CANCELED" || name === "STATUS_CANCELLED") return "void" as const;
    const completed = match.status?.type?.completed || name === "STATUS_FULL_TIME";
    if (!completed) return null;
    const home = Number(match.competitors.find((team) => team.homeAway === "home")?.score ?? "");
    const away = Number(match.competitors.find((team) => team.homeAway === "away")?.score ?? "");
    if (!Number.isFinite(home) || !Number.isFinite(away)) return "void" as const;
    return { home, away };
  }
  return null;
}

function outcome(key: string, score: { home: number; away: number } | "void") {
  if (score === "void") return "void" as const;
  const winner = score.home === score.away ? "X" : score.home > score.away ? "1" : "2";
  return key === winner ? "won" as const : "lost" as const;
}
