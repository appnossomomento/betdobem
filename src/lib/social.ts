import "server-only";
import type { League, RankRow } from "@/data/home";
import { readBoard } from "@/lib/admin-store";
import { publicAvatar } from "@/lib/avatar-url";
import { monthKey } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";

const colors = ["#d6f25c", "#8eb6ff", "#f2a0c0", "#f0c36a", "#8fd0b5", "#c4a6f5", "#f0a07a"];
const inks = ["#1a2208", "#102033", "#3a1020", "#2a1c08", "#102820", "#241433", "#2a140c"];

type Person = { id: string; nick: string; initials: string; balance: number; avatarUrl: string };

export async function loadSocial(viewerId: string) {
  const people = await loadPeople();
  const weekly = rank(people, viewerId);
  const monthly = await loadMonthly(people, viewerId);
  const { mine, open } = await loadLeagues(viewerId, people);
  return { weekly, monthly, mine, open };
}

export async function loadLeague(viewerId: string, leagueId: string) {
  const people = await loadPeople();
  const { mine } = await loadLeagues(viewerId, people);
  return mine.find((league) => league.id === leagueId) ?? null;
}

export async function loadLeaguePreview(leagueId: string): Promise<League | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("leagues").select("id, name, photo_url").eq("id", leagueId).eq("status", "active").maybeSingle();
  if (!data) return null;
  return { id: data.id, name: data.name, photo: data.photo_url ?? undefined, rows: [] };
}

export async function loadPeople(): Promise<Person[]> {
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id, display_name, initials, avatar_url");
  const { data: ledger } = await admin.from("ledger").select("user_id, amount");
  const balances = new Map<string, number>();
  for (const row of ledger ?? []) balances.set(row.user_id, (balances.get(row.user_id) ?? 0) + Number(row.amount));
  const board = await readBoard();
  return (profiles ?? [])
    .filter((profile) => !board.banned.includes(profile.id))
    .map((profile) => ({
      id: profile.id,
      nick: profile.display_name,
      initials: profile.initials,
      avatarUrl: publicAvatar(profile.avatar_url),
      balance: Math.round((balances.get(profile.id) ?? 0) * 100) / 100,
    }));
}

function rank(people: Person[], viewerId: string): RankRow[] {
  return people
    .filter((person) => person.balance !== 0 || person.id === viewerId)
    .sort((a, b) => b.balance - a.balance || a.nick.localeCompare(b.nick, "pt-BR"))
    .map((person, index) => row(person, index, viewerId, person.balance));
}

async function loadMonthly(people: Person[], viewerId: string): Promise<RankRow[]> {
  const admin = createAdminClient();
  const month = monthKey();
  const { data, error } = await admin.from("month_capitals").select("user_id, capital, month_key").eq("month_key", month);
  if (error || !data?.length) return [];
  const byId = new Map(people.map((person) => [person.id, person]));
  return data
    .map((item) => ({ person: byId.get(item.user_id), capital: Number(item.capital) }))
    .filter((item): item is { person: Person; capital: number } => Boolean(item.person))
    .sort((a, b) => b.capital - a.capital || a.person.nick.localeCompare(b.person.nick, "pt-BR"))
    .map((item, index) => row(item.person, index, viewerId, item.capital));
}

async function loadLeagues(viewerId: string, people: Person[]) {
  const admin = createAdminClient();
  const { data: memberships } = await admin.from("league_members").select("league_id, user_id").eq("user_id", viewerId);
  const mineIds = new Set((memberships ?? []).map((item) => item.league_id));
  const { data: leagues } = await admin.from("leagues").select("id, host_id, name, photo_url, duration, player_cap, visibility, outside_prize, created_at, status").eq("status", "active");
  const ids = (leagues ?? []).map((league) => league.id);
  const { data: members } = ids.length ? await admin.from("league_members").select("league_id, user_id").in("league_id", ids) : { data: [] };
  const { data: events } = ids.length ? await admin.from("league_capital_events").select("league_id, user_id, coins, at").in("league_id", ids) : { data: [] };
  const byId = new Map(people.map((person) => [person.id, person]));
  const mapped = (leagues ?? []).map((league) => {
    const roster = (members ?? []).filter((member) => member.league_id === league.id);
    const history = (events ?? []).filter((event) => event.league_id === league.id);
    const rows = roster.map((member, index) => {
      const person = byId.get(member.user_id);
      const closed = history.filter((event) => event.user_id === member.user_id && Date.parse(event.at) >= Date.parse(league.created_at)).reduce((sum, event) => sum + Number(event.coins), 0);
      // A terça guarda o saldo e devolve a banca a 50. Até lá, a liga usa esse mesmo saldo.
      const points = Math.round((closed + (person?.balance ?? 0)) * 100) / 100;
      return {
        place: index + 1,
        initials: person?.initials ?? "??",
        avatarUrl: person?.avatarUrl || undefined,
        name: person?.nick ?? "Jogador",
        you: member.user_id === viewerId,
        points,
        color: colors[index % colors.length],
        ink: inks[index % inks.length],
      };
    }).sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pt-BR")).map((item, index) => ({ ...item, place: index + 1 }));
    const item: League = {
      id: league.id,
      name: league.name,
      rows,
      hosted: league.host_id === viewerId,
      prize: league.outside_prize ?? undefined,
      photo: league.photo_url ?? undefined,
      duration: league.duration,
      playerCap: league.player_cap,
      visibility: league.visibility,
      createdAt: league.created_at,
    };
    return item;
  });
  return {
    mine: mapped.filter((league) => mineIds.has(league.id ?? "") || league.hosted),
    open: mapped.filter((league) => league.visibility === "publica" && !mineIds.has(league.id ?? "") && !league.hosted),
  };
}

function row(person: Person, index: number, viewerId: string, points: number): RankRow {
  return {
    place: index + 1,
    initials: person.initials,
    avatarUrl: person.avatarUrl || undefined,
    name: person.nick,
    you: person.id === viewerId,
    points,
    color: person.id === viewerId ? "#d6f25c" : colors[index % colors.length],
    ink: person.id === viewerId ? "#1a2208" : inks[index % inks.length],
  };
}
