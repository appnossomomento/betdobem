"use client";

import Link from "next/link";
import { useState } from "react";
import { champShort, oddFor, phraseFor, placarOdd, placarPhrase, type OddGame, type Side } from "@/data/home";
import { useBet } from "./BetContext";

export function GameScreen({ game }: { game: OddGame | null }) {
  if (!game) {
    return (
      <section className="rounded-[18px] border border-line bg-card p-5">
        <p className="text-sm text-muted">Esse jogo não está na rodada.</p>
        <Link href="/" className="mt-3 inline-flex text-sm font-semibold text-accent">Voltar ao início</Link>
      </section>
    );
  }
  return <GameBet game={game} />;
}

function GameBet({ game }: { game: OddGame }) {
  const { picks, choose } = useBet();
  const [homeGoals, setHomeGoals] = useState(1);
  const [awayGoals, setAwayGoals] = useState(0);
  const selected = picks[game.id]?.key;

  function chooseSide(side: Side) {
    const odd = oddFor(game, side);
    if (odd == null) return;
    choose(game.id, { key: side, odd, phrase: phraseFor(game, side) });
  }

  function enterPlacar() {
    const home = clamp(homeGoals);
    const away = clamp(awayGoals);
    choose(game.id, {
      key: `placar-${home}-${away}`,
      odd: placarOdd(home, away),
      phrase: placarPhrase(game, home, away),
    });
  }

  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
      <Link href="/" className="text-xs font-semibold text-muted">Voltar</Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{champShort[game.champ]}</p>
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

      <h2 className="mt-6 mb-2 text-xs font-bold tracking-[0.04em] text-muted uppercase">Placar</h2>
      <div className="mb-3 flex items-end gap-2">
        <ScoreField label={game.home} value={homeGoals} onChange={setHomeGoals} labelText="Gols do mandante" />
        <ScoreField label={game.away} value={awayGoals} onChange={setAwayGoals} labelText="Gols do visitante" />
        <button type="button" onClick={enterPlacar} className="rounded-lg bg-accent px-2.5 py-[9px] text-xs font-bold text-accent-ink">Entrar</button>
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        {game.scores.map((item) => {
          const on = selected === item.id;
          return (
            <button key={item.id} type="button" aria-pressed={on} onClick={() => choose(game.id, { key: item.id, odd: item.odd, phrase: item.phrase })} className={`rounded-lg px-1 py-2 text-sm font-bold tabular-nums ${on ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}>
              <small className={`mb-0.5 block text-[10px] font-semibold ${on ? "text-accent-ink" : "text-muted"}`}>{item.label}</small>
              {item.odd.toFixed(2)}
            </button>
          );
        })}
      </div>

      {game.both ? (
        <>
          <h2 className="mt-5 mb-2 text-xs font-bold tracking-[0.04em] text-muted uppercase">Ambos marcam</h2>
          <div className="grid grid-cols-2 gap-1.5">
            <YnButton label="Sim" value={game.both.yes} selected={selected === "btts-y"} onChoose={() => choose(game.id, { key: "btts-y", odd: game.both!.yes, phrase: "Ambos marcam" })} />
            <YnButton label="Não" value={game.both.no} selected={selected === "btts-n"} onChoose={() => choose(game.id, { key: "btts-n", odd: game.both!.no, phrase: "Ambos não marcam" })} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(20, Math.round(value)));
}

function ScoreField({ label, value, onChange, labelText }: { label: string; value: number; onChange: (value: number) => void; labelText: string }) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-muted">
      <span className="truncate">{label}</span>
      <input
        type="number"
        min={0}
        max={20}
        inputMode="numeric"
        aria-label={labelText}
        value={value}
        onChange={(event) => onChange(clamp(Number(event.target.value)))}
        className="w-full rounded-lg bg-card-2 px-2 py-2 text-base font-bold text-ink outline-none"
      />
    </label>
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

function YnButton({ label, value, selected, onChoose }: { label: string; value: number; selected: boolean; onChoose: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onChoose} className={`rounded-lg px-1 py-2 text-sm font-bold tabular-nums ${selected ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}>
      <small className={`mb-0.5 block text-[10px] font-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>{label}</small>
      {value.toFixed(2)}
    </button>
  );
}
