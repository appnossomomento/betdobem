import "server-only";
import { readBoard, type SegmentFilter } from "@/lib/admin-store";
import { weekKey } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";

export type DirectoryUser = {
  id: string;
  email: string;
  nick: string;
  initials: string;
  city: string;
  age: number | null;
  team: string;
  shirt: string;
  bottom: string;
  vip: boolean;
  balance: number;
  bets: number;
  lastBetAt: string | null;
  inLeague: boolean;
  createdAt: string;
  banned: boolean;
  lastSignIn: string | null;
};

export async function loadDirectory(): Promise<DirectoryUser[]> {
  const admin = createAdminClient();
  const board = await readBoard();
  const users = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: profiles } = await admin.from("profiles").select("*");
  const { data: ledger } = await admin.from("ledger").select("user_id, amount");
  const { data: bets } = await admin.from("bets").select("user_id, placed_at");
  const { data: members } = await admin.from("league_members").select("user_id");
  const balances = new Map<string, number>();
  for (const row of ledger ?? []) balances.set(row.user_id, (balances.get(row.user_id) ?? 0) + Number(row.amount));
  const betCount = new Map<string, number>();
  const lastBet = new Map<string, string>();
  for (const row of bets ?? []) {
    betCount.set(row.user_id, (betCount.get(row.user_id) ?? 0) + 1);
    const previous = lastBet.get(row.user_id);
    if (!previous || row.placed_at > previous) lastBet.set(row.user_id, row.placed_at);
  }
  const inLeague = new Set((members ?? []).map((row) => row.user_id as string));
  const byId = new Map((profiles ?? []).map((profile) => [profile.id as string, profile]));
  return (users.data?.users ?? []).map((user) => {
    const profile = byId.get(user.id) as Record<string, unknown> | undefined;
    const meta = user.user_metadata ?? {};
    return {
      id: user.id,
      email: user.email ?? "",
      nick: text(profile?.display_name, meta.nick, meta.display_name) || "Jogador",
      initials: text(profile?.initials) || "JB",
      city: text(profile?.city, meta.city),
      age: numberOrNull(profile?.age ?? meta.age),
      team: text(profile?.favorite_team, meta.favorite_team),
      shirt: text(profile?.shirt_size, meta.shirt_size),
      bottom: text(profile?.bottom_size, meta.bottom_size),
      vip: Boolean(profile?.vip),
      balance: Math.round((balances.get(user.id) ?? 0) * 100) / 100,
      bets: betCount.get(user.id) ?? 0,
      lastBetAt: lastBet.get(user.id) ?? null,
      inLeague: inLeague.has(user.id),
      createdAt: user.created_at,
      banned: board.banned.includes(user.id) || Boolean(profile?.banned_at),
      lastSignIn: user.last_sign_in_at ?? null,
    };
  });
}

export async function loadOverview(people: DirectoryUser[]) {
  const admin = createAdminClient();
  const week = weekKey();
  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: bets } = await admin.from("bets").select("id, user_id, stake, status, placed_at, week_key");
  const { data: legs } = await admin.from("bet_legs").select("bet_id");
  const legCount = new Map<string, number>();
  for (const leg of legs ?? []) legCount.set(leg.bet_id, (legCount.get(leg.bet_id) ?? 0) + 1);
  const recent = (bets ?? []).filter((bet) => bet.placed_at >= since);
  const weekBets = (bets ?? []).filter((bet) => bet.week_key === week);
  const staked = recent.reduce((sum, bet) => sum + Number(bet.stake), 0);
  const multi = (bets ?? []).filter((bet) => (legCount.get(bet.id) ?? 0) > 1).length;
  const bettors = new Set((bets ?? []).map((bet) => bet.user_id));
  const weekBettors = new Set(weekBets.map((bet) => bet.user_id));
  const bands = [0, 0, 0, 0, 0];
  for (const person of people) {
    if (person.balance <= 0) bands[0] += 1;
    else if (person.balance < 50) bands[1] += 1;
    else if (person.balance === 50) bands[2] += 1;
    else if (person.balance <= 100) bands[3] += 1;
    else bands[4] += 1;
  }
  const days = new Map<string, number>();
  for (const person of people) {
    const day = person.createdAt.slice(0, 10);
    days.set(day, (days.get(day) ?? 0) + 1);
  }
  return {
    accounts: people.length,
    recentAccounts: people.filter((person) => person.createdAt >= since).length,
    vips: people.filter((person) => person.vip).length,
    banned: people.filter((person) => person.banned).length,
    openBets: (bets ?? []).filter((bet) => bet.status === "open").length,
    weekBets: weekBets.length,
    staked: Math.round(staked * 100) / 100,
    average: people.length ? Math.round((people.reduce((sum, person) => sum + person.balance, 0) / people.length) * 100) / 100 : 0,
    multi,
    leagues: (await admin.from("leagues").select("id", { count: "exact", head: true }).eq("status", "active")).count ?? 0,
    single: Math.max(0, (bets ?? []).length - multi),
    funnel: [people.length, bettors.size, weekBettors.size],
    bands,
    days: [...days.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-14),
  };
}

export async function loadTeams(people: DirectoryUser[]) {
  const admin = createAdminClient();
  const { data: legs } = await admin.from("bet_legs").select("phrase, odd, result, bet_id");
  const { data: bets } = await admin.from("bets").select("id, stake");
  const stakeOf = new Map((bets ?? []).map((bet) => [bet.id, Number(bet.stake)]));
  const names = new Map<string, { fans: number; bets: number; stake: number; won: number; settled: number }>();
  function bucket(name: string) {
    const current = names.get(name) ?? { fans: 0, bets: 0, stake: 0, won: 0, settled: 0 };
    names.set(name, current);
    return current;
  }
  for (const person of people) bucket(person.team || "sem time").fans += 1;
  for (const leg of legs ?? []) {
    const team = leg.phrase.replace(/^Vitória do /, "");
    if (team === leg.phrase) continue;
    const row = bucket(team);
    row.bets += 1;
    row.stake += stakeOf.get(leg.bet_id) ?? 0;
    if (leg.result === "won" || leg.result === "lost") {
      row.settled += 1;
      if (leg.result === "won") row.won += 1;
    }
  }
  return [...names.entries()].map(([team, row]) => ({
    team,
    fans: row.fans,
    bets: row.bets,
    average: row.bets ? Math.round((row.stake / row.bets) * 100) / 100 : 0,
    hit: row.settled ? Math.round((row.won / row.settled) * 100) : 0,
  })).sort((a, b) => b.fans - a.fans || b.bets - a.bets);
}

export function matches(person: DirectoryUser, filter: SegmentFilter) {
  if (filter.team && person.team !== filter.team) return false;
  if (filter.city && !person.city.toLowerCase().includes(filter.city.toLowerCase())) return false;
  if (filter.ageMin != null && (person.age ?? 0) < filter.ageMin) return false;
  if (filter.ageMax != null && (person.age ?? 999) > filter.ageMax) return false;
  if (filter.vip != null && person.vip !== filter.vip) return false;
  if (filter.banned != null && person.banned !== filter.banned) return false;
  if (filter.balanceMin != null && person.balance < filter.balanceMin) return false;
  if (filter.balanceMax != null && person.balance > filter.balanceMax) return false;
  if (filter.neverBet && person.bets > 0) return false;
  if (filter.betWithinDays != null) {
    if (!person.lastBetAt) return false;
    if (Date.parse(person.lastBetAt) < Date.now() - filter.betWithinDays * 86400000) return false;
  }
  if (filter.inLeague != null && person.inLeague !== filter.inLeague) return false;
  return true;
}

function text(...values: unknown[]) {
  for (const value of values) if (typeof value === "string" && value.trim()) return value.trim();
  return "";
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}
