"use client";

import Link from "next/link";
import { oddFor, phraseFor, type OddGame, type Side } from "@/data/home";
import { useBet } from "./BetContext";

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
  const selected = picks[game.id]?.key;

  function chooseSide(side: Side) {
    const odd = oddFor(game, side);
    if (odd == null) return;
    choose(game.id, { key: side, odd, phrase: phraseFor(game, side), competition: game.competition, when: game.when });
  }

  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
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
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {game.one != null ? <OddButton side="1" value={game.one} selected={selected === "1"} onChoose={() => chooseSide("1")} /> : null}
        {game.draw != null ? <OddButton side="X" value={game.draw} selected={selected === "X"} onChoose={() => chooseSide("X")} /> : null}
        {game.two != null ? <OddButton side="2" value={game.two} selected={selected === "2"} onChoose={() => chooseSide("2")} /> : null}
      </div>

    </section>
  );
}

function OddButton({ side, value, selected, onChoose }: { side: Side; value: number; selected: boolean; onChoose: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onChoose} className={`rounded-lg px-1 py-2 text-sm font-bold tabular-nums ${selected ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}>
      <small className={`mb-0.5 block text-[10px] font-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>{side}</small>
      {value.toFixed(2)}
    </button>
  );
}
