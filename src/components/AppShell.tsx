"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BetProvider, useBet } from "./BetContext";
import { Coin } from "./Icons";

const nav = [
  { label: "Início", href: "/", icon: "M4 11 L12 4 L20 11 V20 H15 V14 H9 V20 H4 Z" },
  { label: "Jogos", href: "/jogos", icon: "M4 12 H20 M12 4 V20", extra: true },
  { label: "Carteira", href: "/#carteira", icon: "M3 6 H21 V19 H3 Z M3 10 H21 M16 15 H18" },
  { label: "Ranking", href: "/ranking", icon: "M7 4 H17 V10 A5 5 0 0 1 7 10 Z M7 6 H4 V8 A3 3 0 0 0 7 11 M17 6 H20 V8 A3 3 0 0 1 17 11 M12 15 V18 M8 20 H16" },
  { label: "Perfil", href: "/#perfil", icon: "M12 4.8 A3.2 3.2 0 1 1 12 11.2 A3.2 3.2 0 1 1 12 4.8 M5 19 C6.2 15.5 8.7 14 12 14 C15.3 14 17.8 15.5 19 19" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <BetProvider>
      <header className="fixed inset-x-0 top-0 z-20 border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-4 min-[880px]:px-6">
          <img src="/logo-bet-do-bem/LogoPrincipal-completo.png" alt="BETdoBEM" className="h-12 w-auto max-w-[52vw]" />
          <Balance />
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 pt-[calc(56px+env(safe-area-inset-top)+16px)] pb-4 min-[880px]:px-6 min-[880px]:pb-5">
        {children}
      </div>
      <Slip />
      <Suspense fallback={<nav className="fixed inset-x-0 bottom-0 z-10 h-16 border-t border-line bg-nav" aria-label="Menu principal" />}>
        <BottomNav />
      </Suspense>
    </BetProvider>
  );
}

function Balance() {
  const { balance } = useBet();
  return (
    <div className="flex items-center gap-2.5">
      <span className="inline-flex items-center gap-1 text-[15px] font-bold tabular-nums">
        <Coin />
        {coins(balance)}
      </span>
      <span className="grid size-[34px] place-items-center rounded-full bg-accent text-[13px] font-bold text-accent-ink">MA</span>
    </div>
  );
}

function Slip() {
  const { slip } = useBet();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        disabled={slip.idle}
        onClick={() => setOpen(true)}
        className={`fixed inset-x-0 z-[9] flex h-[52px] items-center gap-2.5 border-t border-line px-4 pr-3 text-left shadow-[0_10px_28px_rgba(0,0,0,0.28)] ${slip.multi ? "bg-multi" : "bg-card"}`}
        style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }}
        aria-label="Aposta"
      >
        <p className={`m-0 min-w-0 flex-1 truncate font-semibold ${slip.idle ? "text-[13px] font-medium text-muted" : "text-[15px] text-ink"}`}>{slip.text}</p>
        {slip.multi ? <span className="rounded-full bg-multi-pill px-2 py-1 text-[11px] font-bold tracking-wide text-multi-ink uppercase">Múltipla</span> : null}
        <span className={`min-w-16 rounded-[10px] px-2.5 py-1.5 text-center text-[15px] font-bold tabular-nums ${slip.idle ? "bg-card-2 text-muted" : "bg-accent text-accent-ink"}`}>{slip.odd}</span>
      </button>
      {open ? <Ticket onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function Ticket({ onClose }: { onClose: () => void }) {
  const { picks, order, slip, balance, place } = useBet();
  const [stake, setStake] = useState("");
  const [receipt, setReceipt] = useState<{ stake: number; back: number; left: number } | null>(null);
  const amount = Number(stake.replace(",", "."));
  const ready = Number.isFinite(amount) && Math.round(amount * 100) >= 100 && Math.round(amount * 100) <= Math.round(balance * 100);
  const back = ready ? Math.round(amount * Number(slip.odd) * 100) / 100 : null;
  const legs = order.map((id) => picks[id]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function send() {
    if (!ready || back == null) return;
    const left = place(amount);
    if (left == null) return;
    setReceipt({ stake: amount, back, left });
  }

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-bg" role="dialog" aria-modal="true" aria-label="Enviar aposta">
      <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button type="button" onClick={onClose} className="text-sm font-semibold text-muted">Fechar</button>
        <span className="inline-flex items-center gap-1 text-[15px] font-bold tabular-nums">
          <Coin />
          {coins(receipt?.left ?? balance)}
        </span>
      </div>
      {receipt ? (
        <div className="flex flex-1 flex-col justify-between px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">Enviada</p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-tight">Aposta enviada</h2>
            <p className="mt-6 text-sm text-muted">Valor</p>
            <p className="text-2xl font-bold tabular-nums">{coins(receipt.stake)}</p>
            <p className="mt-4 text-sm text-muted">Retorno</p>
            <p className="text-2xl font-bold tabular-nums text-accent">{coins(receipt.back)}</p>
          </div>
          <button type="button" onClick={onClose} className="h-12 rounded-xl bg-accent text-base font-bold text-accent-ink">Fechar</button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 pt-6 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{slip.multi ? "Múltipla" : "Simples"}</p>
          <h2 className="mt-1 text-[22px] font-semibold tracking-tight">{slip.text}</h2>
          <ul className="mt-5 flex flex-col gap-2">
            {order.map((id) => (
              <li key={id} className="flex items-center justify-between gap-3 rounded-xl bg-card px-3 py-3">
                <span className="min-w-0 truncate text-sm font-semibold">{picks[id].phrase}</span>
                <span className="text-sm font-bold tabular-nums text-accent">{picks[id].odd.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[40px] font-bold tracking-tight tabular-nums text-accent">{slip.odd}</p>
          {slip.multi ? <p className="text-center text-sm font-semibold tabular-nums text-muted">{legs.map((leg) => leg.odd.toFixed(2)).join(" × ")}</p> : null}
          <label className="mt-6 block text-sm font-semibold text-muted">
            Valor
            <input
              inputMode="decimal"
              value={stake}
              onChange={(event) => setStake(event.target.value)}
              className="mt-1.5 h-12 w-full rounded-xl bg-card px-3 text-lg font-bold text-ink outline-none"
            />
          </label>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-muted">Retorno</span>
            <span className="text-lg font-bold tabular-nums">{back == null ? "–" : coins(back)}</span>
          </div>
          <button type="button" disabled={!ready} onClick={send} className="mt-auto h-12 rounded-xl bg-accent text-base font-bold text-accent-ink disabled:bg-card-2 disabled:text-muted">Enviar aposta</button>
        </div>
      )}
    </div>
  );
}

function coins(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-nav pb-[env(safe-area-inset-bottom)]" style={{ height: "calc(64px + env(safe-area-inset-bottom))" }} aria-label="Menu principal">
      {nav.map((item) => {
        const active = item.href === "/" ? pathname === "/" : item.href === "/jogos" ? pathname === "/jogos" || pathname.startsWith("/jogo/") : pathname === item.href;
        return (
          <Link key={item.label} href={item.href} aria-current={active ? "page" : undefined} className={`flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${active ? "text-accent" : "text-muted"}`}>
            <NavIcon d={item.icon} ball={item.extra} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavIcon({ d, ball }: { d: string; ball?: boolean }) {
  if (ball) {
    return (
      <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden="true">
        <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 4 V8 M12 16 V20 M4 12 H8 M16 12 H20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-[22px]" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
