"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, createContext, useContext, useEffect, useRef, useState } from "react";
import type { Account } from "@/lib/account";
import { saveSlip } from "@/lib/slip-store";
import { BetProvider, useBet } from "./BetContext";
import { Coin } from "./Icons";
import { ScreenFade } from "./ScreenFade";

const AccountContext = createContext<Account | null>(null);

export function useAccount() {
  return useContext(AccountContext);
}

const nav = [
  { label: "Início", href: "/", icon: "M4 11 L12 4 L20 11 V20 H15 V14 H9 V20 H4 Z" },
  { label: "Jogos", href: "/jogos", icon: "M4 12 H20 M12 4 V20", extra: true },
  { label: "Carteira", href: "/carteira", icon: "M3 6 H21 V19 H3 Z M3 10 H21 M16 15 H18" },
  { label: "Ranking", href: "/ranking", icon: "M7 4 H17 V10 A5 5 0 0 1 7 10 Z M7 6 H4 V8 A3 3 0 0 0 7 11 M17 6 H20 V8 A3 3 0 0 1 17 11 M12 15 V18 M8 20 H16" },
  { label: "Perfil", href: "/perfil", icon: "M12 4.8 A3.2 3.2 0 1 1 12 11.2 A3.2 3.2 0 1 1 12 4.8 M5 19 C6.2 15.5 8.7 14 12 14 C15.3 14 17.8 15.5 19 19" },
];

export function AppShell({ children, account }: { children: React.ReactNode; account: Account | null }) {
  const items = account ? nav : nav.filter((item) => item.href === "/jogos");
  return (
    <AccountContext.Provider value={account}>
      <BetProvider initialBalance={account ? account.balance : null}>
        <header className="fixed inset-x-0 top-0 z-20 border-b border-line bg-bg pt-[env(safe-area-inset-top)]">
          <div className="mx-auto flex h-14 max-w-[1120px] items-center justify-between px-4 min-[880px]:px-6">
            <img src="/logo-bet-do-bem/LogoPrincipal-completo.png" alt="BETdoBEM" className="h-12 w-auto max-w-[52vw]" />
            <Balance initials={account?.initials ?? null} unread={account?.unread ?? 0} />
          </div>
        </header>
        <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-4 px-4 pt-[calc(56px+env(safe-area-inset-top)+16px)] pb-4 min-[880px]:px-6 min-[880px]:pb-5">
          <ScreenFade>{children}</ScreenFade>
        </div>
        <Slip />
        <Suspense fallback={<nav className="fixed inset-x-0 bottom-0 z-10 h-16 border-t border-line bg-nav" aria-label="Menu principal" />}>
          <BottomNav items={items} />
        </Suspense>
      </BetProvider>
    </AccountContext.Provider>
  );
}

function Balance({ initials, unread }: { initials: string | null; unread: number }) {
  const { balance, signedIn } = useBet();
  if (!signedIn || !initials) {
    return <Link href="/" className="rounded-full bg-accent px-3 py-1.5 text-sm font-bold text-accent-ink">Entrar</Link>;
  }
  return (
    <div className="flex items-center gap-2.5">
      <Link href="/avisos" className="relative text-sm font-bold text-ink" aria-label="Avisos">
        Sino
        {unread > 0 ? <span className="absolute -top-2 -right-3 grid min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] text-accent-ink">{unread}</span> : null}
      </Link>
      <span className="inline-flex items-center gap-1 text-[15px] font-bold tabular-nums"><Coin />{coins(balance)}</span>
      <Link href="/perfil" className="grid size-[34px] place-items-center rounded-full bg-accent text-[13px] font-bold text-accent-ink">{initials}</Link>
    </div>
  );
}

function Slip() {
  const { slip } = useBet();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false);
  const hide = useRef<number | null>(null);
  function openTicket() {
    if (hide.current) window.clearTimeout(hide.current);
    setShown(true);
    requestAnimationFrame(() => setOpen(true));
  }
  function closeTicket() {
    setOpen(false);
    hide.current = window.setTimeout(() => setShown(false), 160);
  }
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("bilhete") === "1" && !slip.idle) openTicket();
  }, [slip.idle]);
  return (
    <>
      <button type="button" disabled={slip.idle} onClick={openTicket} className={`fixed inset-x-0 z-[9] flex h-[52px] items-center gap-2.5 border-t border-line px-4 text-left ${slip.multi ? "bg-multi" : "bg-card"}`} style={{ bottom: "calc(64px + env(safe-area-inset-bottom))" }} aria-label="Aposta">
        <p className={`m-0 min-w-0 flex-1 truncate font-semibold ${slip.idle ? "text-[13px] font-medium text-muted" : "text-[15px] text-ink"}`}>{slip.text}</p>
        {slip.multi ? <span className="rounded-full bg-multi-pill px-2 py-1 text-[11px] font-bold tracking-wide text-multi-ink uppercase">Múltipla</span> : null}
        <span className={`min-w-16 rounded-[10px] px-2.5 py-1.5 text-center text-[15px] font-bold tabular-nums ${slip.idle ? "bg-card-2 text-muted" : "bg-accent text-accent-ink"}`}>{slip.odd}</span>
      </button>
      {shown ? <Ticket on={open} onClose={closeTicket} /> : null}
    </>
  );
}

const placeError = {
  entre: "Entre na conta para enviar.",
  valor: "O valor mínimo é 1.",
  jogo: "Esse jogo saiu da rodada.",
  odd: "A odd mudou. Feche e escolha de novo.",
  saldo: "Saldo insuficiente.",
  grava: "Não foi possível enviar.",
  suspensa: "Conta suspensa.",
  repetida: "Essa aposta já foi enviada.",
} as const;

function Ticket({ on, onClose }: { on: boolean; onClose: () => void }) {
  const { picks, order, slip, balance, signedIn, place, remove } = useBet();
  const router = useRouter();
  const [stake, setStake] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [receipt, setReceipt] = useState<{ stake: number; back: number; left: number; id: string } | null>(null);
  const amount = Number(stake.replace(",", "."));
  const quoted = Number.isFinite(amount) && Math.round(amount * 100) >= 100 ? Math.round(amount * Number(slip.odd) * 100) / 100 : null;
  const ready = signedIn && quoted != null && Math.round(amount * 100) <= Math.round(balance * 100);
  const legs = order.map((id) => picks[id]).filter(Boolean);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeRef.current();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    if (order.length === 0 && !receipt) closeRef.current();
  }, [order.length, receipt]);

  async function send() {
    if (!ready || sending) return;
    setSending(true);
    setError("");
    const result = await place(amount);
    setSending(false);
    if (!result?.ok) {
      setError(result ? placeError[result.error] : placeError.grava);
      return;
    }
    setReceipt({ stake: result.stake, back: result.back, left: result.balance, id: result.id });
  }

  function enter() {
    saveSlip({ picks, order });
    router.push("/");
  }

  return (
    <div className={`presence fixed inset-0 z-40 flex flex-col bg-bg ${on ? "presence-on" : ""}`} role="dialog" aria-modal="true" aria-label="Bilhete">
      <div className="grid grid-cols-3 items-center px-4 pt-[calc(env(safe-area-inset-top)+12px)]">
        <button type="button" onClick={onClose} className="text-left text-sm font-semibold text-muted">Fechar</button>
        <h2 className="text-center text-base font-semibold">Bilhete</h2>
        {signedIn ? <span className="inline-flex items-center justify-end gap-1 text-[15px] font-bold tabular-nums"><Coin />{coins(receipt?.left ?? balance)}</span> : <span />}
      </div>
      {receipt ? (
        <div className="flex flex-1 flex-col justify-between px-4 pt-10 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <div>
            <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">Enviada</p>
            <h3 className="mt-2 text-[28px] font-semibold tracking-tight">Aposta enviada</h3>
            <p className="mt-2 text-xs font-semibold tracking-[0.08em] text-muted uppercase">{receipt.id.slice(0, 8)}</p>
            <p className="mt-6 text-sm text-muted">Valor</p>
            <p className="text-2xl font-bold tabular-nums">{coins(receipt.stake)}</p>
            <p className="mt-4 text-sm text-muted">Retorno</p>
            <p className="text-2xl font-bold tabular-nums text-accent">{coins(receipt.back)}</p>
          </div>
          <button type="button" onClick={onClose} className="h-12 rounded-xl bg-accent text-base font-bold text-accent-ink">Fechar</button>
        </div>
      ) : (
        <div className="flex flex-1 flex-col px-4 pt-5 pb-[calc(env(safe-area-inset-bottom)+20px)]">
          <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{slip.multi ? "Múltipla" : "Simples"}</p>
          <ul className="mt-3 flex flex-col gap-2">
            {order.map((id) => (
              <li key={id} className="rounded-2xl border border-line bg-card px-3 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{picks[id].phrase}</p>
                    <p className="mt-1 text-xs text-muted">{[picks[id].competition, picks[id].when].filter(Boolean).join(" · ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-accent px-2 py-1 text-sm font-bold text-accent-ink tabular-nums">{picks[id].odd.toFixed(2)}</span>
                    <button type="button" onClick={() => remove(id)} className="text-sm font-semibold text-[#c4292e]" aria-label="Remover perna">Tirar</button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-center text-[40px] font-bold tracking-tight text-accent tabular-nums">{slip.odd}</p>
          {slip.multi ? <p className="text-center text-sm font-semibold text-muted tabular-nums">{legs.map((leg) => leg.odd.toFixed(2)).join(" × ")}</p> : null}
          <label className="mt-5 block text-sm font-semibold text-muted">
            Valor
            <input inputMode="decimal" value={stake} onChange={(event) => setStake(event.target.value)} className="mt-1.5 h-12 w-full rounded-xl bg-card px-3 text-lg font-bold text-ink outline-none" />
          </label>
          <div className="mt-3 flex gap-2">
            {[5, 10, 25].map((chip) => (
              <button key={chip} type="button" onClick={() => setStake(String(chip))} className="h-9 flex-1 rounded-full bg-card-2 text-sm font-bold">{chip}</button>
            ))}
            {signedIn ? <button type="button" onClick={() => setStake(String(balance))} className="h-9 flex-1 rounded-full bg-card-2 text-sm font-bold">Tudo</button> : null}
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-sm font-semibold text-muted">Retorno</span>
            <span className="text-lg font-bold text-accent tabular-nums">{quoted == null ? "–" : coins(quoted)}</span>
          </div>
          {error ? <p className="mt-3 text-sm text-accent" role="status">{error}</p> : null}
          {signedIn ? (
            <button type="button" disabled={!ready || sending} onClick={send} className="mt-auto h-12 rounded-xl bg-accent text-base font-bold text-accent-ink disabled:bg-card-2 disabled:text-muted">{sending ? "Enviando" : "Enviar aposta"}</button>
          ) : (
            <button type="button" onClick={enter} className="mt-auto h-12 rounded-xl bg-accent text-base font-bold text-accent-ink">Entrar para enviar</button>
          )}
        </div>
      )}
    </div>
  );
}

function coins(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function BottomNav({ items }: { items: typeof nav }) {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-nav pb-[env(safe-area-inset-bottom)]" style={{ height: "calc(64px + env(safe-area-inset-bottom))" }} aria-label="Menu principal">
      {items.map((item) => {
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
