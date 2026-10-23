"use client";

import { useState } from "react";
import { Coin } from "./Icons";

type Leg = { phrase: string; odd: number; result: string | null };
type Bet = { id: string; stake: number; combined_odd: number; potential_return: number; status: string; placed_at: string; bet_legs: Leg[] };
type Entry = { id: string; kind: string; amount: number; created_at: string };

const statusLabel: Record<string, string> = { open: "Aberta", won: "Ganha", lost: "Perdida", void: "Anulada" };
const kindLabel: Record<string, string> = { marco_zero: "Marco zero", stake: "Aposta", payout: "Retorno", reset: "Reset", ajuste: "Ajuste" };

export function CarteiraScreen({ balance, bets, ledger }: { balance: number; bets: Bet[]; ledger: Entry[] }) {
  const open = bets.filter((bet) => bet.status === "open");
  const done = bets.filter((bet) => bet.status !== "open");
  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">Carteira</p>
        <h1 className="mt-1 inline-flex items-center gap-2 text-3xl font-bold tabular-nums"><Coin />{money(balance)}</h1>
      </header>
      <Block title="Abertas" empty="Nenhuma aposta">{open.map((bet) => <BetCard key={bet.id} bet={bet} />)}</Block>
      <Block title="Encerradas" empty="Nenhuma aposta">{done.map((bet) => <BetCard key={bet.id} bet={bet} />)}</Block>
      <section className="rounded-[18px] border border-line bg-card px-[18px] py-4">
        <h2 className="text-[15px]">Extrato</h2>
        <ul>
          {ledger.length === 0 ? <li className="border-t border-line py-4 text-sm text-muted">Nenhuma aposta</li> : ledger.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between gap-3 border-t border-line py-3">
              <span>
                <b className="block text-sm font-semibold">{kindLabel[entry.kind] ?? entry.kind}</b>
                <span className="text-xs text-muted">{when(entry.created_at)}</span>
              </span>
              <span className={`font-bold tabular-nums ${Number(entry.amount) < 0 ? "text-ink" : "text-accent"}`}>{signed(Number(entry.amount))}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
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

function BetCard({ bet }: { bet: Bet }) {
  const [open, setOpen] = useState(false);
  const legs = bet.bet_legs ?? [];
  return (
    <li className="border-t border-line py-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-start justify-between gap-3 text-left">
        <span className="min-w-0">
          <b className="block truncate text-sm font-semibold">{legs[0]?.phrase ?? "Aposta"}</b>
          <span className="text-xs text-muted">{statusLabel[bet.status] ?? bet.status} · {Number(bet.combined_odd).toFixed(2)}</span>
        </span>
        <span className="text-right">
          <b className="block font-bold tabular-nums">{money(Number(bet.stake))}</b>
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
