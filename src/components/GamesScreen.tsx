"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { champs, liveLabel, oddFor, phraseFor, type ChampFilter, type OddGame, type Side } from "@/data/home";
import { kickoffDay, marketOpen, marketOpenLabel } from "@/lib/market";
import { useBet } from "./BetContext";
import { LivePulse } from "./LivePulse";
import { useMarketNow } from "./MarketClock";
import { PlacarToggle } from "./PlacarEntry";

const chipLabel: Record<ChampFilter, string> = {
  todos: "Todos",
  brasileiro: "Brasileirão",
  estadual: "Estadual",
  libertadores: "Libertadores",
};

const groupOrder = ["Ao vivo", "Hoje", "Sábado", "Domingo"];

export function GamesScreen({ games }: { games: OddGame[] }) {
  const { picks, choose } = useBet();
  const now = useMarketNow();
  const [filter, setFilter] = useState<ChampFilter>("todos");
  const [moved, setMoved] = useState(false);

  const visible = useMemo(() => (filter === "todos" ? games : games.filter((game) => game.champ === filter)), [filter, games]);
  const groups = useMemo(() => {
    const buckets = new Map<string, OddGame[]>();
    for (const game of visible) {
      if (game.finished) continue;
      const key = game.live ? "Ao vivo" : dayOf(game.when);
      buckets.set(key, [...(buckets.get(key) ?? []), game]);
    }
    for (const list of buckets.values()) list.sort((a, b) => minutes(a.when) - minutes(b.when));
    const rest = [...buckets.keys()].filter((key) => !groupOrder.includes(key));
    return [...groupOrder, ...rest].filter((key) => buckets.has(key)).map((key) => ({ key, games: buckets.get(key)! }));
  }, [visible]);
  const finished = useMemo(
    () => visible.filter((game) => game.finished).sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [visible],
  );

  const total = groups.reduce((sum, group) => sum + group.games.length, 0) + finished.length;

  function chooseSide(game: OddGame, side: Side) {
    if (kickoffDay(game.kickoff) !== "today" || !marketOpen(game.kickoff)) return;
    const odd = oddFor(game, side);
    if (odd == null) return;
    choose(game.id, { key: side, odd, phrase: phraseFor(game, side), competition: game.competition, when: game.when });
  }

  return (
    <div className="flex flex-col gap-4">
      <LivePulse games={games} />
      <header>
        <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">Futebol</p>
        <h1 className="mt-1 text-xl tracking-tight">Jogos</h1>
        <p className="mt-1 text-sm text-muted">
          {total} {total === 1 ? "jogo" : "jogos"} nesta semana
        </p>
      </header>

      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist" aria-label="Campeonato">
        {champs.map((champ) => {
          const on = filter === champ.id;
          return (
            <button
              key={champ.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => { setMoved(true); setFilter(champ.id); }}
              className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors duration-150 ${on ? "bg-accent text-accent-ink" : "bg-card-2 text-ink"}`}
            >
              {chipLabel[champ.id]}
            </button>
          );
        })}
      </div>

      <div key={filter} className={moved ? "soft-in flex flex-col gap-4" : "flex flex-col gap-4"}>
      {groups.length === 0 && finished.length === 0 && games.length > 0 ? <p className="text-sm text-muted">Nenhum jogo neste campeonato.</p> : null}

      {groups.map((group) => (
        <section key={group.key} className="flex flex-col gap-3" aria-label={group.key}>
          <h2 className="text-[15px] tracking-tight">{group.key}</h2>
          <div className={`grid gap-3 ${group.key === "Ao vivo" ? "grid-cols-1" : "grid-cols-2 min-[880px]:grid-cols-3"}`}>
            {group.games.map((game) => (
              <MatchCard key={game.id} game={game} now={now} selected={picks[game.id]?.key} onChoose={(side) => chooseSide(game, side)} />
            ))}
          </div>
        </section>
      ))}
      {finished.length > 0 ? (
        <section className="flex flex-col gap-3" aria-label="Jogos encerrados">
          <h2 className="text-[15px] tracking-tight text-muted">Jogos encerrados</h2>
          <div className="grid grid-cols-2 gap-3 min-[880px]:grid-cols-3">
            {finished.map((game) => (
              <FinishedCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      ) : null}
      </div>
    </div>
  );
}

function MatchCard({ game, now, selected, onChoose }: { game: OddGame; now: number; selected?: string; onChoose: (side: Side) => void }) {
  const live = game.live;
  const score = game.score !== "–" ? game.score : null;
  const day = kickoffDay(game.kickoff, now);
  const open = day === "today" && marketOpen(game.kickoff, now);

  return (
    <article className="min-w-0 rounded-[18px] border border-line bg-card p-2.5 shadow-[0_10px_28px_rgba(0,0,0,0.28)] min-[880px]:p-4">
      <div className="flex items-start justify-between gap-1.5">
        <span className="min-w-0 truncate text-[10px] font-semibold tracking-[0.08em] text-muted uppercase min-[880px]:text-xs">{game.competition}</span>
        <span className="flex shrink-0 flex-col items-end gap-1">
          {live ? <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-accent-ink min-[880px]:px-2 min-[880px]:py-1 min-[880px]:text-xs">{liveLabel(game.clock)}</span> : null}
          <span className="text-[10px] text-muted tabular-nums min-[880px]:text-xs">{game.when}</span>
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 min-[880px]:mt-3">
        <div className="min-w-0 flex-1">
          <SideTeam name={game.home} logo={game.homeLogo} />
          <SideTeam name={game.away} logo={game.awayLogo} />
        </div>
        {score ? <span className="text-base font-bold tracking-tight tabular-nums min-[880px]:text-[22px]">{score}</span> : null}
      </div>
      {open && game.one != null ? <p className="mt-2 text-[10px] font-semibold tracking-[0.08em] text-muted uppercase min-[880px]:mt-3 min-[880px]:text-[11px]">Resultado final</p> : null}
      {day === "future" ? (
        <div className="mt-1.5 grid grid-cols-3 gap-1 min-[880px]:gap-1.5">
          {game.one != null ? <QuietOdd side="1" value={game.one} /> : null}
          {game.draw != null ? <QuietOdd side="X" value={game.draw} /> : null}
          {game.two != null ? <QuietOdd side="2" value={game.two} /> : null}
          <p className="col-span-3 px-1 pt-1 text-center text-[10px] font-semibold leading-snug whitespace-nowrap text-[#a56b6e] min-[880px]:text-[11px]">{marketOpenLabel(game.kickoff)}</p>
        </div>
      ) : open ? (
        <div className="mt-1.5 grid grid-cols-3 gap-1 min-[880px]:gap-1.5">
          {game.one != null ? <Odd side="1" value={game.one} on={selected === "1"} onChoose={() => onChoose("1")} /> : null}
          {game.draw != null ? <Odd side="X" value={game.draw} on={selected === "X"} onChoose={() => onChoose("X")} /> : null}
          {game.two != null ? <Odd side="2" value={game.two} on={selected === "2"} onChoose={() => onChoose("2")} /> : null}
          <PlacarToggle game={game} />
        </div>
      ) : live ? (
        <Link href={`/jogo/${game.id}`} className="mt-3 block">
          <p className="text-xs font-semibold text-accent">Minuto a minuto</p>
          {game.plays?.length ? <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted">{game.plays[game.plays.length - 1].text}</p> : null}
        </Link>
      ) : (
        <p className="mt-3 text-xs font-semibold text-muted">Mercado fechado</p>
      )}
    </article>
  );
}

function FinishedCard({ game }: { game: OddGame }) {
  return (
    <Link href={`/jogo/${game.id}`} className="min-w-0 rounded-[18px] border border-line/60 bg-card/40 p-2.5 min-[880px]:p-4">
      <div className="flex items-start justify-between gap-1.5">
        <span className="min-w-0 truncate text-[10px] font-semibold tracking-[0.08em] text-muted uppercase min-[880px]:text-xs">{game.competition}</span>
        <span className="text-[10px] text-muted tabular-nums min-[880px]:text-xs">{game.when}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 min-[880px]:mt-3">
        <div className="min-w-0 flex-1">
          <SideTeam name={game.home} logo={game.homeLogo} muted />
          <SideTeam name={game.away} logo={game.awayLogo} muted />
        </div>
        <span className="text-base font-semibold tracking-tight text-muted tabular-nums min-[880px]:text-[22px]">{game.score}</span>
      </div>
    </Link>
  );
}

function SideTeam({ name, logo, muted }: { name: string; logo: string; muted?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 py-0.5 min-[880px]:gap-2">
      <img src={logo} alt="" className={`size-5 shrink-0 object-contain min-[880px]:size-6 ${muted ? "opacity-45 grayscale" : ""}`} />
      <b className={`truncate text-sm min-[880px]:text-[15px] ${muted ? "font-medium text-muted" : "font-semibold"}`}>{name}</b>
    </span>
  );
}

function QuietOdd({ side, value }: { side: Side; value: number }) {
  return (
    <span className="rounded-lg bg-card-2 px-0.5 py-1.5 text-center text-sm font-bold text-accent tabular-nums min-[880px]:px-1 min-[880px]:py-2">
      <small className="mb-0.5 block text-[10px] font-semibold text-muted">{side}</small>
      {value.toFixed(2)}
    </span>
  );
}

function Odd({ side, value, on, onChoose }: { side: Side; value: number; on: boolean; onChoose: () => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={onChoose} className={`rounded-lg px-0.5 py-1.5 text-sm font-bold tabular-nums min-[880px]:px-1 min-[880px]:py-2 ${on ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}>
      <small className={`mb-0.5 block text-[10px] font-semibold ${on ? "text-accent-ink" : "text-muted"}`}>{side}</small>
      {value.toFixed(2)}
    </button>
  );
}

function dayOf(when: string) {
  const [day] = when.split(" ");
  if (!day || day === "hoje") return "Hoje";
  return day.charAt(0).toUpperCase() + day.slice(1);
}

function minutes(when: string) {
  const match = when.match(/(\d{1,2})h(\d{2})?/);
  if (!match) return 0;
  return Number(match[1]) * 60 + Number(match[2] ?? 0);
}
