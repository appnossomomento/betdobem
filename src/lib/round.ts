import { cacheLife } from "next/cache";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Champ, OddGame, RoundCard } from "@/data/home";

const zone = "America/Sao_Paulo";
const freshFor = 12 * 60 * 60 * 1000;
const leagues: { slug: string; champ: Champ }[] = [
  { slug: "bra.1", champ: "brasileiro" },
  { slug: "conmebol.libertadores", champ: "libertadores" },
];

type Payload = { games: OddGame[]; cards: RoundCard[] };
type CacheFile = Payload & { savedAt: number };

export async function getRound(): Promise<Payload> {
  "use cache";
  cacheLife("hours");
  return loadRound();
}

async function loadRound(): Promise<Payload> {
  const cached = await readCache();
  if (cached && Date.now() - cached.savedAt < freshFor) return { games: cached.games, cards: cached.cards };

  try {
    const start = saoPauloDay(new Date());
    const games: OddGame[] = [];
    const seen = new Set<string>();
    for (const league of leagues) {
      for (let offset = 0; offset <= 6; offset += 1) {
        const day = shiftDay(start, offset).replaceAll("-", "");
        const rows = await scoreboard(league.slug, day);
        for (const game of rows) {
          if (seen.has(game.id) || saoPauloDay(new Date(game.kickoff)) < start) continue;
          seen.add(game.id);
          games.push({ ...game, champ: league.champ });
        }
      }
    }
    games.sort(byKickoff);
    const cards = games.slice(0, 6).map(toCard);
    const payload = { games, cards };
    await writeCache({ ...payload, savedAt: Date.now() });
    return payload;
  } catch (error) {
    console.error(error);
    return cached ? { games: cached.games, cards: cached.cards } : { games: [], cards: [] };
  }
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
  const live = state === "in";
  const price = match.odds?.[0]?.moneyline;
  return {
    id: String(event.id),
    champ: "brasileiro",
    when: whenLabel(event.date, live),
    home: home.team.displayName,
    away: away.team.displayName,
    homeLogo: home.team.logo,
    awayLogo: away.team.logo,
    one: decimal(price?.home?.close?.odds),
    draw: decimal(price?.draw?.close?.odds),
    two: decimal(price?.away?.close?.odds),
    live,
    score: state === "pre" ? "–" : `${home.score ?? 0}–${away.score ?? 0}`,
    kickoff: event.date,
    scores: [],
  };
}

function toCard(game: OddGame): RoundCard {
  return {
    league: game.champ === "libertadores" ? "Libertadores" : "Brasileirão",
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

function saoPauloDay(date: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: zone }).format(date);
}

function shiftDay(day: string, days: number) {
  const [year, month, date] = day.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, date + days));
  return next.toISOString().slice(0, 10);
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
    status?: { type?: { state?: string } };
    odds?: { moneyline?: { home?: { close?: { odds?: string } }; draw?: { close?: { odds?: string } }; away?: { close?: { odds?: string } } } }[];
  }[];
};
