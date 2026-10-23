export type Side = "1" | "X" | "2";

export type Champ = "brasileiro" | "estadual" | "libertadores";

export type ChampFilter = "todos" | Champ;

export type ScorePick = {
  id: string;
  label: string;
  odd: number;
  phrase: string;
};

export type RoundCard = {
  league: string;
  live: boolean;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  score: string;
  when: string;
  venue: string;
};

export type OddGame = {
  id: string;
  champ: Champ;
  when: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  one: number | null;
  draw: number | null;
  two: number | null;
  live: boolean;
  score: string;
  kickoff: string;
  scores: ScorePick[];
  both?: { yes: number; no: number };
};

export type RankRow = {
  place: number;
  initials: string;
  name: string;
  you?: boolean;
  points: number;
  color: string;
  ink: string;
};

export type LeagueVisibility = "publica" | "privada";

export type LeagueCapitalEvent = {
  userId: string;
  at: string;
  coins: number;
};

export type League = {
  name: string;
  rows: RankRow[];
  hosted?: boolean;
  prize?: string;
  photo?: string;
  duration?: string;
  playerCap?: number;
  visibility?: LeagueVisibility;
  createdAt?: string;
  history?: LeagueCapitalEvent[];
};

export function standingsFromHistory(league: League): RankRow[] {
  const start = league.createdAt ? Date.parse(league.createdAt) : 0;
  const totals = new Map(league.rows.map((row) => [row.initials, 0]));
  for (const event of league.history ?? []) {
    if (Date.parse(event.at) < start) continue;
    totals.set(event.userId, (totals.get(event.userId) ?? 0) + event.coins);
  }
  return [...league.rows]
    .map((row) => ({ ...row, points: totals.get(row.initials) ?? 0 }))
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "pt-BR"))
    .map((row, index) => ({ ...row, place: index + 1 }));
}

export const viewer = { vip: true };

const people = {
  ma: { initials: "MA", name: "Marina", you: true, color: "#d6f25c", ink: "#1a2208" },
  lu: { initials: "LU", name: "Lucas", color: "#8eb6ff", ink: "#102033" },
  an: { initials: "AN", name: "Ana", color: "#f2a0c0", ink: "#3a1020" },
  ra: { initials: "RA", name: "Rafa", color: "#f0c36a", ink: "#2a1c08" },
  ca: { initials: "CA", name: "Caio", color: "#8fd0b5", ink: "#102820" },
  bi: { initials: "BI", name: "Bia", color: "#c4a6f5", ink: "#241433" },
  th: { initials: "TH", name: "Theo", color: "#f0a07a", ink: "#2a140c" },
} as const;

function row(place: number, who: keyof typeof people, points: number): RankRow {
  return { place, points, ...people[who] };
}

export const champs: { id: ChampFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "brasileiro", label: "Campeonato Brasileiro" },
  { id: "estadual", label: "Estadual" },
  { id: "libertadores", label: "Libertadores" },
];

export const champShort: Record<Champ, string> = {
  brasileiro: "Brasileirão",
  estadual: "Estadual",
  libertadores: "Libertadores",
};

export const weekly: RankRow[] = [row(1, "ma", 186), row(2, "lu", 174), row(3, "an", 161), row(4, "ra", 149), row(5, "ca", 138)];

export const monthly: RankRow[] = [row(1, "an", 640), row(2, "ma", 612), row(3, "lu", 588), row(4, "ca", 501), row(5, "ra", 477)];

export const leagues: League[] = [
  { name: "Resenha de quinta", rows: [row(1, "ma", 186), row(2, "lu", 174), row(3, "an", 161), row(4, "ra", 149), row(5, "ca", 138)] },
  { name: "Os de casa", rows: [row(1, "an", 210), row(2, "ma", 198), row(3, "lu", 181), row(4, "ra", 160), row(5, "ca", 144)] },
  { name: "Galera do trabalho", rows: [row(3, "bi", 156), row(4, "ra", 149), row(5, "ma", 141), row(6, "th", 133), row(7, "ca", 120)] },
];

export const leagueMarks = [
  "linear-gradient(90deg, #1a2208 0 34%, #d6f25c 34% 67%, #6f8f2a 67% 100%)",
  "linear-gradient(90deg, #3a2414 0 34%, #f0c36a 34% 67%, #8a5a28 67% 100%)",
  "linear-gradient(90deg, #142433 0 34%, #8eb6ff 34% 67%, #3d5f8a 67% 100%)",
];

export function phraseFor(game: OddGame, side: Side) {
  if (side === "1") return `Vitória do ${game.home}`;
  if (side === "2") return `Vitória do ${game.away}`;
  return `Empate ${game.home} x ${game.away}`;
}

export function oddFor(game: OddGame, side: Side) {
  if (side === "1") return game.one;
  if (side === "2") return game.two;
  return game.draw;
}

export function placarOdd(homeGoals: number, awayGoals: number) {
  return Math.round((7.5 + homeGoals * 0.8 + awayGoals * 1.1) * 100) / 100;
}

export function placarPhrase(game: OddGame, homeGoals: number, awayGoals: number) {
  return `Placar ${game.home} ${homeGoals}–${awayGoals}`;
}
