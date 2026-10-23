"use server";

import { oddFor, phraseFor, placarOdd, placarPhrase, type Side } from "@/data/home";
import { readBoard } from "@/lib/admin-store";
import { weekKey } from "@/lib/economy";
import { kickoffDay, marketOpen } from "@/lib/market";
import { getRound } from "@/lib/round";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type PlaceResult =
  | { ok: true; balance: number; stake: number; back: number; id: string }
  | { ok: false; error: "entre" | "valor" | "jogo" | "odd" | "saldo" | "grava" | "suspensa" | "repetida" | "fechado" | "dia" };

type LegInput = { fixtureId: string; key: string; odd: number };

export async function placeBet(stake: number, legs: LegInput[]): Promise<PlaceResult> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) return { ok: false, error: "entre" };
  const board = await readBoard();
  if (board.banned.includes(user.id)) return { ok: false, error: "suspensa" };

  const cents = Math.round(stake * 100);
  if (!Number.isFinite(cents) || cents < 100 || legs.length === 0) return { ok: false, error: "valor" };

  const round = await getRound();
  const locked: { fixture_id: string; market: string; selection_key: string; phrase: string; odd: number; competition: string }[] = [];
  for (const leg of legs) {
    const game = round.games.find((item) => item.id === leg.fixtureId);
    if (!game) return { ok: false, error: "jogo" };
    if (kickoffDay(game.kickoff) === "future") return { ok: false, error: "dia" };
    if (!marketOpen(game.kickoff)) return { ok: false, error: "fechado" };
    const score = scoreLine(leg.key);
    if (score) {
      const odd = placarOdd(score.home, score.away);
      if (Math.abs(odd - leg.odd) > 0.011) return { ok: false, error: "odd" };
      locked.push({
        fixture_id: game.id,
        market: "placar",
        selection_key: leg.key,
        phrase: placarPhrase(game, score.home, score.away),
        odd,
        competition: game.competition,
      });
      continue;
    }
    if (!isSide(leg.key)) return { ok: false, error: "odd" };
    const odd = oddFor(game, leg.key);
    if (odd == null || Math.abs(odd - leg.odd) > 0.011) return { ok: false, error: "odd" };
    locked.push({
      fixture_id: game.id,
      market: "1x2",
      selection_key: leg.key,
      phrase: phraseFor(game, leg.key),
      odd,
      competition: game.competition,
    });
  }

  const combined = Math.round(locked.reduce((total, leg) => total * leg.odd, 1) * 10000) / 10000;
  const back = Math.round((cents / 100) * combined * 100) / 100;
  const amount = cents / 100;

  const admin = createAdminClient();
  const { data: ledger, error: ledgerReadError } = await admin.from("ledger").select("amount").eq("user_id", user.id);
  if (ledgerReadError) return { ok: false, error: "grava" };
  const balance = (ledger ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  if (Math.round(balance * 100) < cents) return { ok: false, error: "saldo" };

  const signature = locked.map((leg) => `${leg.fixture_id}:${leg.selection_key}`).sort().join("|");
  const since = new Date(Date.now() - 15000).toISOString();
  const { data: recent } = await admin.from("bets").select("stake, bet_legs(fixture_id, selection_key)").eq("user_id", user.id).gte("placed_at", since);
  const repeated = (recent ?? []).some((bet) => {
    const legs = (bet.bet_legs ?? []) as { fixture_id: string; selection_key: string }[];
    const same = legs.map((leg) => `${leg.fixture_id}:${leg.selection_key}`).sort().join("|");
    return same === signature && Math.round(Number(bet.stake) * 100) === cents;
  });
  if (repeated) return { ok: false, error: "repetida" };

  const week = weekKey();
  const { data: bet, error: betError } = await admin
    .from("bets")
    .insert({
      user_id: user.id,
      stake: amount,
      combined_odd: combined,
      potential_return: back,
      status: "open",
      week_key: week,
    })
    .select("id")
    .single();
  if (betError || !bet) return { ok: false, error: "grava" };

  const withCompetition = locked.map((leg) => ({ ...leg, bet_id: bet.id }));
  let legsError = (await admin.from("bet_legs").insert(withCompetition)).error;
  if (legsError) {
    legsError = (await admin.from("bet_legs").insert(withCompetition.map(({ competition: _competition, ...leg }) => leg))).error;
  }
  if (legsError) {
    await admin.from("bets").delete().eq("id", bet.id);
    return { ok: false, error: "grava" };
  }

  const { error: debitError } = await admin.from("ledger").insert({
    user_id: user.id,
    kind: "stake",
    amount: -amount,
    ref_type: "bet",
    ref_id: bet.id,
    week_key: week,
  });
  if (debitError) {
    await admin.from("bets").delete().eq("id", bet.id);
    return { ok: false, error: "grava" };
  }

  return { ok: true, balance: Math.round((balance - amount) * 100) / 100, stake: amount, back, id: bet.id };
}

function isSide(key: string): key is Side {
  return key === "1" || key === "X" || key === "2";
}

function scoreLine(key: string) {
  const match = /^P:(\d{1,2})-(\d{1,2})$/.exec(key);
  if (!match) return null;
  const home = Number(match[1]);
  const away = Number(match[2]);
  if (home > 20 || away > 20) return null;
  return { home, away };
}
