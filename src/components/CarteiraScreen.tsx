"use client";

import { useState } from "react";
import { monthProfit, totalSaldo, weekProfit } from "@/lib/economy";
import { Chevron, Coin } from "./Icons";

type Crest = { homeLogo: string; awayLogo: string };
type Leg = { phrase: string; odd: number; result: string | null; fixture_id?: string; selection_key?: string };
type Bet = { id: string; stake: number; combined_odd: number; potential_return: number; status: string; placed_at: string; week_key?: string; bet_legs: Leg[] };
type Entry = { id: string; kind: string; amount: number; created_at: string };

const statusLabel: Record<string, string> = { open: "Aberta", won: "Ganha", lost: "Perdida", void: "Anulada" };
const kindLabel: Record<string, string> = { marco_zero: "Marco zero", stake: "Aposta", payout: "Retorno", reset: "Reset", ajuste: "Ajuste" };

export function CarteiraScreen({
  balance,
  closedSaldo = 0,
  bets,
  ledger,
  crests = {},
}: {
  balance: number;
  closedSaldo?: number;
  bets: Bet[];
  ledger: Entry[];
  crests?: Record<string, Crest>;
}) {
  const open = bets.filter((bet) => bet.status === "open");
  const done = bets.filter((bet) => bet.status !== "open");
  const weekly = weekProfit(bets);
  const monthly = monthProfit(bets);
  const total = totalSaldo(closedSaldo, weekly);
  const recent = ledger.slice(0, 6);
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2.5">
        <Stat label="Lucro semanal" value={weekly} glow />
        <Stat label="Lucro mensal" value={monthly} />
        <Stat label="Carteira" value={balance} />
        <Stat label="Lucro total" value={total} />
      </div>
      <Block title="Abertas" empty="Nenhuma aposta">{open.map((bet) => <BetCard key={bet.id} bet={bet} />)}</Block>
      <FoldBlock title="Encerradas" empty="Nenhuma aposta">{done.map((bet) => <BetCard key={bet.id} bet={bet} crests={crests} mark />)}</FoldBlock>
      <FoldBlock title="Extrato" empty="Nenhuma aposta">
        {recent.map((entry) => {
          const amount = Number(entry.amount);
          const tone = entry.kind === "stake" ? "text-ink" : amount < 0 ? "text-[#c4292e]" : "text-accent";
          return (
            <li key={entry.id} className="flex items-center justify-between gap-3 border-t border-line py-3">
              <span>
                <b className="block text-sm font-semibold">{kindLabel[entry.kind] ?? entry.kind}</b>
                <span className="text-xs text-muted">{when(entry.created_at)}</span>
              </span>
              <span className={`font-bold tabular-nums ${tone}`}>{signed(amount)}</span>
            </li>
          );
        })}
      </FoldBlock>
    </div>
  );
}

function Stat({ label, value, glow = false }: { label: string; value: number; glow?: boolean }) {
  const rim = !glow ? "border-line" : value < 0 ? "border-[#c4292e]/80 shadow-[0_0_16px_rgba(196,41,46,0.28)]" : "border-[#d6f25c]/80 shadow-[0_0_16px_rgba(214,242,92,0.28)]";
  return (
    <article className={`flex min-h-20 min-w-0 flex-col gap-2 rounded-[18px] border bg-card px-3 py-3 min-[880px]:min-h-24 min-[880px]:px-4 ${rim}`}>
      <p className="text-xs font-semibold leading-tight text-muted">{label}</p>
      <p className="inline-flex items-center gap-1.5 text-2xl font-bold leading-none tabular-nums min-[880px]:text-3xl"><Coin />{money(value)}</p>
    </article>
  );
}

function Block({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] py-4">
      <h2 className="mb-1 text-[15px]">{title}</h2>
      {children.length === 0 ? <p className="border-t border-line py-4 text-sm text-muted">{empty}</p> : <ul>{children}</ul>}
    </section>
  );
}

function FoldBlock({ title, empty, children }: { title: string; empty: string; children: React.ReactNode[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] py-4">
      <button type="button" className="flex w-full items-center justify-between" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        <h2 className="text-[15px]">{title}</h2>
        <span className={`chevron text-muted ${open ? "rotate-180" : ""}`}>
          <Chevron dir="down" />
        </span>
      </button>
      <div className={`fold ${open ? "fold-open" : ""}`}>
        <div className={`fold-inner ${open ? "mt-1" : ""}`}>
          {children.length === 0 ? <p className="border-t border-line py-4 text-sm text-muted">{empty}</p> : <ul>{children}</ul>}
        </div>
      </div>
    </section>
  );
}

function BetCard({ bet, crests, mark = false }: { bet: Bet; crests?: Record<string, Crest>; mark?: boolean }) {
  const [open, setOpen] = useState(false);
  const legs = bet.bet_legs ?? [];
  const logos = mark ? logosFor(legs, crests ?? {}) : [];
  const multi = legs.length > 1;
  return (
    <li className="border-t border-line py-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="flex min-w-0 items-start gap-2.5">
          {mark ? <PickMark logos={logos} multi={multi} /> : null}
          <span className="min-w-0">
            <b className="block truncate text-sm font-semibold">{legs[0]?.phrase ?? "Aposta"}</b>
            <span className="text-xs text-muted">{statusLabel[bet.status] ?? bet.status} · {Number(bet.combined_odd).toFixed(2)}{multi ? " · Múltipla" : ""}</span>
          </span>
        </span>
        <span className="text-right">
          <b className="block font-bold tabular-nums text-ink">{money(Number(bet.stake))}</b>
          <span className="text-xs text-accent tabular-nums">{money(Number(bet.potential_return))}</span>
        </span>
      </button>
      <div className={`fold ${open ? "fold-open" : ""}`}>
        <div className="fold-inner">
          <ul className={`flex flex-col gap-1 ${open ? "mt-2" : ""}`}>
            {legs.map((leg, index) => (
              <li key={`${bet.id}-${index}`} className="flex justify-between text-xs text-muted">
                <span>{leg.phrase}</span>
                <span className="tabular-nums">{Number(leg.odd).toFixed(2)} {leg.result ? `· ${leg.result}` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}

function PickMark({ logos, multi }: { logos: string[]; multi: boolean }) {
  if (logos.length === 0) {
    return <span className="grid size-9 shrink-0 place-items-center rounded-full bg-card-2 text-[10px] font-bold text-muted">{multi ? "M" : "?"}</span>;
  }
  if (logos.length === 1) {
    return <img src={logos[0]} alt="" className="size-9 shrink-0 object-contain" />;
  }
  if (!multi && logos.length === 2) {
    return (
      <span className="relative flex size-9 shrink-0 items-center justify-center">
        <img src={logos[0]} alt="" className="absolute left-0 size-5 object-contain" />
        <img src={logos[1]} alt="" className="absolute right-0 size-5 object-contain" />
      </span>
    );
  }
  const shown = logos.slice(0, 2);
  const extra = logos.length - shown.length;
  return (
    <span className="relative flex size-9 shrink-0 items-center">
      {shown.map((logo, index) => (
        <img key={`${logo}-${index}`} src={logo} alt="" className={`size-6 object-contain ${index > 0 ? "-ml-2" : ""}`} />
      ))}
      {extra > 0 ? <span className="absolute -right-1 -bottom-0.5 rounded bg-card-2 px-1 text-[9px] font-bold text-muted">+{extra}</span> : multi ? <span className="absolute -right-1 -bottom-0.5 rounded bg-card-2 px-1 text-[9px] font-bold text-muted">M</span> : null}
    </span>
  );
}

function logosFor(legs: Leg[], crests: Record<string, Crest>) {
  const logos: string[] = [];
  for (const leg of legs) {
    const crest = leg.fixture_id ? crests[leg.fixture_id] : undefined;
    if (!crest) continue;
    const key = leg.selection_key ?? "";
    if (key === "1") logos.push(crest.homeLogo);
    else if (key === "2") logos.push(crest.awayLogo);
    else if (key === "X") {
      logos.push(crest.homeLogo, crest.awayLogo);
    } else {
      const score = /^P:(\d+)-(\d+)$/.exec(key);
      if (!score) continue;
      const home = Number(score[1]);
      const away = Number(score[2]);
      if (home > away) logos.push(crest.homeLogo);
      else if (away > home) logos.push(crest.awayLogo);
      else logos.push(crest.homeLogo, crest.awayLogo);
    }
  }
  return [...new Set(logos)];
}

function money(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function signed(value: number) {
  const text = money(Math.abs(value));
  return value < 0 ? `-${text}` : `+${text}`;
}

function when(iso: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(iso));
}
