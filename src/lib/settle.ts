import { weekKey } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";

const slugs = ["bra.1", "conmebol.libertadores", "bra.camp.paulista", "bra.camp.carioca", "bra.camp.mineiro", "bra.camp.gaucho"];

type Score = { home: number; away: number };
type Outcome = "won" | "lost" | "void";
type Leg = { id: string; fixture_id: string; selection_key: string; odd: number };
type OpenBet = { id: string; user_id: string; stake: number; bet_legs: Leg[] };

export async function settleFinished(games: { id: string; finished: boolean; score: string }[]) {
  const scores = new Map<string, Score>();
  for (const game of games) {
    if (!game.finished) continue;
    const score = parseScore(game.score);
    if (score) scores.set(game.id, score);
  }
  if (scores.size === 0) return 0;
  const admin = createAdminClient();
  const { data: touched } = await admin.from("bet_legs").select("bet_id").in("fixture_id", [...scores.keys()]);
  const ids = [...new Set((touched ?? []).map((leg) => leg.bet_id))];
  if (ids.length === 0) return 0;
  const { data: bets } = await admin.from("bets").select("id, user_id, stake, bet_legs(id, fixture_id, selection_key, odd)").in("id", ids).eq("status", "open");
  return closeBets((bets ?? []) as OpenBet[], async (fixtureId) => scores.get(fixtureId) ?? null);
}

export async function settleOpenBets() {
  const admin = createAdminClient();
  const { data: bets } = await admin.from("bets").select("id, user_id, stake, bet_legs(id, fixture_id, selection_key, odd)").eq("status", "open");
  return closeBets((bets ?? []) as OpenBet[], finalScore);
}

async function closeBets(bets: OpenBet[], resolve: (fixtureId: string) => Promise<Score | "void" | null>) {
  const admin = createAdminClient();
  let settled = 0;
  for (const bet of bets) {
    const legs = bet.bet_legs ?? [];
    if (legs.length === 0) continue;
    const scores = await Promise.all(legs.map((leg) => resolve(leg.fixture_id)));
    const outcomes = scores.map((score, index) => (score == null ? null : outcome(legs[index].selection_key, score)));
    for (let index = 0; index < legs.length; index += 1) {
      if (!outcomes[index]) continue;
      await admin.from("bet_legs").update({ result: outcomes[index] }).eq("id", legs[index].id);
    }
    const lost = outcomes.some((item) => item === "lost");
    if (!lost && outcomes.some((item) => item == null)) continue;
    const allVoid = outcomes.every((item) => item === "void");
    const status = lost ? "lost" : allVoid ? "void" : "won";
    const product = legs.reduce((total, leg, index) => (outcomes[index] === "void" ? total : total * Number(leg.odd)), 1);
    const amount = status === "void" ? Number(bet.stake) : Math.round(Number(bet.stake) * product * 100) / 100;
    if (await finishBet(bet, status, amount)) settled += 1;
  }
  return settled;
}

async function finishBet(bet: OpenBet, status: "lost" | "void" | "won", amount: number) {
  const admin = createAdminClient();
  const settledAt = new Date().toISOString();
  if (status === "lost") {
    const { data } = await admin.from("bets").update({ status, settled_at: settledAt }).eq("id", bet.id).eq("status", "open").select("id");
    return Boolean(data?.length);
  }
  const { data: paid } = await admin.from("ledger").select("id").eq("ref_id", bet.id).in("kind", ["payout", "ajuste"]).limit(1);
  let inserted: string | null = null;
  if (!paid?.length) {
    const { data } = await admin
      .from("ledger")
      .insert({
        user_id: bet.user_id,
        kind: status === "void" ? "ajuste" : "payout",
        amount,
        ref_type: "bet",
        ref_id: bet.id,
        week_key: weekKey(),
      })
      .select("id")
      .single();
    inserted = data?.id ?? null;
  }
  const { data: claimed } = await admin.from("bets").update({ status, settled_at: settledAt }).eq("id", bet.id).eq("status", "open").select("id");
  if (!claimed?.length && inserted) await admin.from("ledger").delete().eq("id", inserted);
  return Boolean(claimed?.length);
}

function parseScore(score: string): Score | null {
  const match = /^(\d+)\s*[–-]\s*(\d+)$/.exec(score.trim());
  if (!match) return null;
  return { home: Number(match[1]), away: Number(match[2]) };
}

function outcome(key: string, score: Score | "void"): Outcome {
  if (score === "void") return "void";
  const line = /^P:(\d{1,2})-(\d{1,2})$/.exec(key);
  if (line) return Number(line[1]) === score.home && Number(line[2]) === score.away ? "won" : "lost";
  const winner = score.home === score.away ? "X" : score.home > score.away ? "1" : "2";
  return key === winner ? "won" : "lost";
}

async function finalScore(fixtureId: string): Promise<Score | "void" | null> {
  for (const slug of slugs) {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/summary?event=${fixtureId}`, {
      headers: { "user-agent": "betdobem" },
      cache: "no-store",
    });
    if (!response.ok) continue;
    const body = (await response.json()) as { header?: { competitions?: { status?: { type?: { completed?: boolean; name?: string } }; competitors?: { homeAway?: string; score?: string }[] }[] } };
    const match = body.header?.competitions?.[0];
    if (!match?.competitors?.length) continue;
    const name = match.status?.type?.name ?? "";
    if (name === "STATUS_POSTPONED" || name === "STATUS_CANCELED" || name === "STATUS_CANCELLED") return "void";
    const completed = match.status?.type?.completed || name === "STATUS_FULL_TIME";
    if (!completed) return null;
    const home = Number(match.competitors.find((team) => team.homeAway === "home")?.score ?? "");
    const away = Number(match.competitors.find((team) => team.homeAway === "away")?.score ?? "");
    if (!Number.isFinite(home) || !Number.isFinite(away)) return "void";
    return { home, away };
  }
  return null;
}
