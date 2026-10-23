import { connection } from "next/server";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Champ, OddGame, RoundCard } from "@/data/home";
import { settleFinished } from "@/lib/settle";
import { createAdminClient } from "@/lib/supabase/admin";

const zone = "America/Sao_Paulo";
const freshFor = 12 * 60 * 60 * 1000;
const leagues: { slug: string; champ: Champ; label: string }[] = [
  { slug: "bra.1", champ: "brasileiro", label: "Brasileirão" },
  { slug: "conmebol.libertadores", champ: "libertadores", label: "Libertadores" },
  { slug: "bra.camp.paulista", champ: "estadual", label: "Paulista" },
  { slug: "bra.camp.carioca", champ: "estadual", label: "Carioca" },
  { slug: "bra.camp.mineiro", champ: "estadual", label: "Mineiro" },
  { slug: "bra.camp.gaucho", champ: "estadual", label: "Gaúcho" },
];

/** No escopo, sem slug no placar gratuito: Pernambucano, Goiano, Catarinense, Baiano, Cearense, Potiguar. */

type Payload = { games: OddGame[]; cards: RoundCard[] };
type CacheFile = Payload & { savedAt: number; version: number };

const cacheVersion = 4;

export async function getRound(): Promise<Payload> {
  await connection();
  return loadRound();
}

async function loadRound(): Promise<Payload> {
  const cached = (await readCache()) ?? (await readRemote());
  const maxAge = cached?.games.some((game) => game.live) ? 10 * 60 * 1000 : freshFor;
  if (cached && cached.version === cacheVersion && Date.now() - cached.savedAt < maxAge) return deliver(cached);

  try {
    const start = weekStartDay();
    const endDay = shiftDay(start, 7);
    const startMs = saoPauloMark(start);
    const endMs = saoPauloMark(endDay);
    const games: OddGame[] = [];
    const seen = new Set<string>();
    for (const league of leagues) {
      for (let day = start; day <= endDay; day = shiftDay(day, 1)) {
        const rows = await scoreboard(league.slug, day.replaceAll("-", ""));
        for (const game of rows) {
          const kick = Date.parse(game.kickoff);
          if (seen.has(game.id) || !Number.isFinite(kick) || kick < startMs || kick >= endMs) continue;
          seen.add(game.id);
          games.push({ ...game, champ: league.champ, competition: league.label });
        }
      }
    }
    games.sort(byKickoff);
    const open = games.filter((game) => !game.finished);
    const cards = (open.length ? open : games).slice(0, 6).map(toCard);
    const payload = { games, cards };
    const stamped = { ...payload, savedAt: Date.now(), version: cacheVersion };
    await writeCache(stamped);
    await writeRemote(stamped);
    return deliver(payload);
  } catch (error) {
    console.error(error);
    return cached ? deliver(cached) : { games: [], cards: [] };
  }
}

async function deliver(payload: Payload): Promise<Payload> {
  try {
    await settleFinished(payload.games);
  } catch (error) {
    console.error(error);
  }
  return { games: payload.games, cards: payload.cards };
}

async function scoreboard(slug: string, day: string): Promise<OddGame[]> {
  const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/${slug}/scoreboard?dates=${day}`, {
    headers: { "user-agent": "betdobem" },
  });
  if (!response.ok) return [];
  const body = (await response.json()) as { events?: EspnEvent[] };
  return (body.events ?? []).map(toGame).filter((game): game is OddGame => game != null);
}

function toGame(event: EspnEvent): OddGame | null {
  const match = event.competitions?.[0];
  if (!match) return null;
  const home = match.competitors?.find((team) => team.homeAway === "home");
  const away = match.competitors?.find((team) => team.homeAway === "away");
  if (!home || !away) return null;
  const state = match.status?.type?.state;
  const statusName = match.status?.type?.name ?? "";
  const live = state === "in";
  const finished = state === "post" && statusName !== "STATUS_POSTPONED" && statusName !== "STATUS_CANCELED" && statusName !== "STATUS_CANCELLED" && statusName !== "STATUS_SUSPENDED";
  const price = match.odds?.[0]?.moneyline;
  return {
    id: String(event.id),
    champ: "brasileiro",
    competition: "Brasileirão",
    when: whenLabel(event.date, live),
    home: home.team.displayName,
    away: away.team.displayName,
    homeLogo: home.team.logo,
    awayLogo: away.team.logo,
    one: decimal(price?.home?.close?.odds),
    draw: decimal(price?.draw?.close?.odds),
    two: decimal(price?.away?.close?.odds),
    live,
    finished,
    score: state === "pre" ? "–" : `${home.score ?? 0}–${away.score ?? 0}`,
    kickoff: event.date,
    scores: [],
  };
}

function toCard(game: OddGame): RoundCard {
  return {
    league: game.competition,
    live: game.live,
    home: game.home,
    away: game.away,
    homeLogo: game.homeLogo,
    awayLogo: game.awayLogo,
    score: game.score,
    when: game.when,
    venue: "",
  };
}

function byKickoff(a: OddGame, b: OddGame) {
  if (a.live !== b.live) return a.live ? -1 : 1;
  return a.kickoff.localeCompare(b.kickoff);
}

function decimal(american: string | undefined) {
  if (!american) return null;
  const value = Number(american);
  if (!Number.isFinite(value) || value === 0) return null;
  const odd = value > 0 ? value / 100 + 1 : 100 / Math.abs(value) + 1;
  return Math.round(odd * 100) / 100;
}

function whenLabel(iso: string, live: boolean) {
  const kick = new Date(iso);
  const today = saoPauloDay(new Date());
  const day = saoPauloDay(kick);
  const parts = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: zone }).formatToParts(kick);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  const clock = minute === "00" ? `${hour}h` : `${hour}h${minute}`;
  const name = live || day === today ? "hoje" : new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: zone }).format(kick).toLowerCase();
  return `${name} ${clock}`;
}

function saoPauloMark(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return Date.UTC(year, month - 1, date, 4, 0, 0);
}

function weekStartDay(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "Tue";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const sinceTuesday: Record<string, number> = { Tue: 0, Wed: 1, Thu: 2, Fri: 3, Sat: 4, Sun: 5, Mon: 6 };
  const back = weekday === "Tue" && hour < 1 ? 7 : sinceTuesday[weekday] ?? 0;
  return shiftDay(saoPauloDay(now), -back);
}

function saoPauloDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(date);
}

function shiftDay(day: string, days: number) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + days));
  return next.toISOString().slice(0, 10);
}

async function readRemote(): Promise<CacheFile | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("fixtures_cache").select("payload, saved_at").eq("id", "round").maybeSingle();
    if (!data?.payload) return null;
    const payload = data.payload as CacheFile;
    return { games: payload.games ?? [], cards: payload.cards ?? [], savedAt: Date.parse(data.saved_at), version: payload.version ?? 0 };
  } catch {
    return null;
  }
}

async function writeRemote(payload: CacheFile) {
  try {
    const admin = createAdminClient();
    await admin.from("fixtures_cache").upsert({ id: "round", payload, saved_at: new Date(payload.savedAt).toISOString() });
  } catch {
    return;
  }
}

async function readCache(): Promise<CacheFile | null> {
  try {
    const raw = await readFile(cachePath(), "utf8");
    return JSON.parse(raw) as CacheFile;
  } catch {
    return null;
  }
}

async function writeCache(payload: CacheFile) {
  const file = cachePath();
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(payload));
}

function cachePath() {
  return path.join(process.cwd(), ".data", "round.json");
}

type EspnEvent = {
  id: string;
  date: string;
  competitions?: {
    competitors?: { homeAway: string; score?: string; team: { displayName: string; logo: string } }[];
    status?: { type?: { state?: string; name?: string } };
    odds?: { moneyline?: { home?: { close?: { odds?: string } }; draw?: { close?: { odds?: string } }; away?: { close?: { odds?: string } } } }[];
  }[];
};
