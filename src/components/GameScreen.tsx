"use client";

import Link from "next/link";
import { liveLabel, oddFor, oddSideLabel, phraseFor, type OddGame, type Side } from "@/data/home";
import { kickoffDay, marketOpen, marketOpenLabel } from "@/lib/market";
import { useBet } from "./BetContext";
import { LivePulse } from "./LivePulse";
import { useMarketNow } from "./MarketClock";

export function GameScreen({ game }: { game: OddGame | null }) {
  if (!game) {
    return (
      <section className="rounded-[18px] border border-line bg-card p-5">
        <p className="text-sm text-muted">Esse jogo não está na rodada.</p>
        <Link href="/jogos" className="mt-3 inline-flex text-sm font-semibold text-accent">Voltar aos jogos</Link>
      </section>
    );
  }
  return <GameBet game={game} />;
}

function GameBet({ game }: { game: OddGame }) {
  const { picks, choose } = useBet();
  const now = useMarketNow();
  const day = kickoffDay(game.kickoff, now);
  const open = day === "today" && marketOpen(game.kickoff, now);
  const selected = picks[game.id]?.key;

  function chooseSide(side: Side) {
    if (kickoffDay(game.kickoff) !== "today" || !marketOpen(game.kickoff)) return;
    const odd = oddFor(game, side);
    if (odd == null) return;
    choose(game.id, { key: side, odd, phrase: phraseFor(game, side), competition: game.competition, when: game.when });
  }

  const plays = [...(game.plays ?? [])].reverse();

  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
      <LivePulse games={[game]} />
      <Link href="/jogos" className="text-xs font-semibold text-muted">Voltar</Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{game.competition}</p>
          <h1 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight">
            <img src={game.homeLogo} alt="" className="size-7 object-contain" />
            {game.home}
            <span className="text-muted">x</span>
            {game.away}
            <img src={game.awayLogo} alt="" className="size-7 object-contain" />
          </h1>
          <p className="mt-1 text-[13px] text-muted">{game.when}</p>
        </div>
        {game.live ? <span className="shrink-0 rounded-full bg-accent px-2 py-1 text-xs font-semibold text-accent-ink">{liveLabel(game.clock)}</span> : null}
      </div>
      {game.live || game.finished ? (
        <div className="mt-5">
          <p className="text-[28px] font-bold tabular-nums">{game.score}</p>
          <h2 className="mt-5 text-[15px] tracking-tight">Minuto a minuto</h2>
          {plays.length === 0 ? <p className="mt-2 text-sm text-muted">Os lances aparecem aqui.</p> : (
            <ol className="mt-2">
              {plays.map((play, index) => (
                <li key={`${play.minute}-${index}`} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 border-t border-line py-2.5">
                  <span className="text-xs font-semibold text-accent tabular-nums">{play.minute || "–"}</span>
                  <span className="text-sm leading-snug">{play.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : day === "future" ? (
        <div className="mt-5">
          <div className="grid grid-cols-3 gap-2">
            {game.one != null ? <QuietOdd label={oddSideLabel(game, "1")} value={game.one} /> : null}
            {game.draw != null ? <QuietOdd label={oddSideLabel(game, "X")} value={game.draw} /> : null}
            {game.two != null ? <QuietOdd label={oddSideLabel(game, "2")} value={game.two} /> : null}
          </div>
          <p className="mt-3 text-center text-sm font-semibold text-[#a56b6e]">{marketOpenLabel(game.kickoff)}</p>
        </div>
      ) : open ? (
        <div className="mt-5 grid grid-cols-3 gap-2">
          {game.one != null ? <OddButton label={oddSideLabel(game, "1")} value={game.one} selected={selected === "1"} onChoose={() => chooseSide("1")} /> : null}
          {game.draw != null ? <OddButton label={oddSideLabel(game, "X")} value={game.draw} selected={selected === "X"} onChoose={() => chooseSide("X")} /> : null}
          {game.two != null ? <OddButton label={oddSideLabel(game, "2")} value={game.two} selected={selected === "2"} onChoose={() => chooseSide("2")} /> : null}
        </div>
      ) : (
        <p className="mt-5 text-sm font-semibold text-muted">Mercado fechado</p>
      )}

    </section>
  );
}

function QuietOdd({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-lg bg-card-2 px-1 py-2 text-center text-sm font-bold text-accent tabular-nums">
      <small className="mb-0.5 block text-[10px] font-semibold text-muted">{label}</small>
      {value.toFixed(2)}
    </span>
  );
}

function OddButton({ label, value, selected, onChoose }: { label: string; value: number; selected: boolean; onChoose: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onChoose} className={`rounded-lg px-1 py-2 text-sm font-bold tabular-nums ${selected ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}>
      <small className={`mb-0.5 block text-[10px] font-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>{label}</small>
      {value.toFixed(2)}
    </button>
  );
}
