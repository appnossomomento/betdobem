"use client";

import { useState } from "react";
import { placarOdd, placarPhrase, type OddGame } from "@/data/home";
import { marketOpen } from "@/lib/market";
import { useBet } from "./BetContext";

export function PlacarToggle({ game }: { game: OddGame }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="col-span-3">
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className={`flex w-full items-center justify-center rounded-lg px-2 py-1.5 text-[11px] font-semibold min-[880px]:text-xs ${open ? "bg-accent text-accent-ink" : "bg-card-2 text-ink"}`}>
        Placar
      </button>
      <div className={`fold ${open ? "fold-open" : ""}`}>
        <div className="fold-inner" inert={open ? undefined : true}>
          <PlacarEntry game={game} />
        </div>
      </div>
    </div>
  );
}

function PlacarEntry({ game }: { game: OddGame }) {
  const { picks, choose } = useBet();
  const [home, setHome] = useState("1");
  const [away, setAway] = useState("0");
  const homeGoals = goals(home);
  const awayGoals = goals(away);
  const key = `P:${homeGoals}-${awayGoals}`;
  const odd = placarOdd(homeGoals, awayGoals);
  const on = picks[game.id]?.key === key;

  return (
    <div className="flex items-end gap-1 pt-1.5">
      <Goal label={game.home} value={home} onChange={setHome} />
      <Goal label={game.away} value={away} onChange={setAway} />
      <button
        type="button"
        aria-pressed={on}
        onClick={() => {
          if (!marketOpen(game.kickoff)) return;
          choose(game.id, { key, odd, phrase: placarPhrase(game, homeGoals, awayGoals), competition: game.competition, when: game.when });
        }}
        className={`shrink-0 rounded-lg px-2 py-1.5 text-xs font-bold tabular-nums ${on ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}
      >
        {odd.toFixed(2)}
      </button>
    </div>
  );
}

function Goal({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="min-w-0 flex-1 text-[10px] font-semibold text-muted">
      <span className="block truncate">{label}</span>
      <input
        inputMode="numeric"
        value={value}
        aria-label={`Gols de ${label}`}
        onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 2))}
        className="mt-1 w-full rounded-lg bg-card-2 px-2 py-1.5 text-sm font-bold text-ink outline-none"
      />
    </label>
  );
}

function goals(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(20, Math.max(0, parsed));
}
