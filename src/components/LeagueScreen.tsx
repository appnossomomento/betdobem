"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { League, RankRow } from "@/data/home";
import { endLeague, joinLeague, leaveLeague } from "@/lib/leagues";
import { Coin } from "./Icons";
import { RankAvatar } from "./RankAvatar";

const medalSrc = {
  1: "/medals/gold.png",
  2: "/medals/silver.png",
  3: "/medals/bronze.png",
} as const;

export function LeagueScreen({ league, member, invite, signedIn, acceptOnLoad }: { league: League; member: boolean; invite: boolean; signedIn: boolean; acceptOnLoad: boolean }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!acceptOnLoad || member || !signedIn || !league.id) return;
    let cancel = false;
    setPending(true);
    joinLeague({ id: league.id }).then((result) => {
      if (cancel) return;
      if (!result.ok) {
        setPending(false);
        setMessage(result.error);
        return;
      }
      router.replace(`/liga/${league.id}`);
      router.refresh();
    });
    return () => {
      cancel = true;
    };
  }, [acceptOnLoad, league.id, member, router, signedIn]);

  async function exit() {
    if (!league.id || pending) return;
    setPending(true);
    const result = league.hosted ? await endLeague(league.id) : await leaveLeague(league.id);
    if (!result.ok) {
      setPending(false);
      setMessage(result.error);
      return;
    }
    router.push("/ranking");
    router.refresh();
  }

  async function share() {
    if (!league.id) return;
    const url = `${window.location.origin}/liga/${league.id}?convite=1`;
    try {
      if (navigator.share) {
        await navigator.share({ title: league.name, url });
        return;
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Link copiado.");
    } catch {
      setMessage(url);
    }
  }

  async function accept() {
    if (!league.id || pending) return;
    if (!signedIn) {
      sessionStorage.setItem("betdobem.convite", league.id);
      router.push("/");
      return;
    }
    setPending(true);
    const result = await joinLeague({ id: league.id });
    if (!result.ok) {
      setPending(false);
      setMessage(result.error);
      return;
    }
    router.replace(`/liga/${league.id}`);
    router.refresh();
  }

  function decline() {
    router.push(signedIn ? "/ranking" : "/jogos");
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      {member ? (
        <>
          <div className="overflow-hidden rounded-[18px] border border-line bg-card-2">
            {league.photo ? (
              <img src={league.photo} alt="" className="h-52 w-full object-cover" />
            ) : (
              <div className="h-52 w-full bg-card-2" />
            )}
          </div>
          <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-2" aria-labelledby="liga-titulo">
            <h1 id="liga-titulo" className="text-xl tracking-tight">{league.name}</h1>
            <p className="mt-1 text-xs text-muted">{league.hosted ? "Anfitrião" : "Você participa"}</p>
            <div className="mt-4 grid grid-cols-[28px_1fr_auto] gap-2.5 px-0.5 pb-1 text-[11px] font-semibold tracking-[0.08em] text-muted uppercase">
              <span>#</span>
              <span>Jogador</span>
              <span>Patrimônio</span>
            </div>
            <ol>
              {league.rows.length === 0 ? (
                <li className="border-t border-line py-6 text-sm text-muted">Ninguém no ranking ainda</li>
              ) : (
                league.rows.map((row) => <RankLine key={`${row.place}-${row.name}`} row={row} host={Boolean(league.hosted && row.you)} />)
              )}
            </ol>
          </section>
          {message ? <p className="text-sm text-accent" role="status">{message}</p> : null}
          <button type="button" onClick={share} className="h-12 w-full rounded-xl bg-accent text-base font-bold text-accent-ink">Convide amigos</button>
          <button type="button" onClick={exit} disabled={pending} className="h-12 w-full rounded-xl bg-[#c4292e] text-base font-bold text-white disabled:opacity-60">Sair da liga</button>
        </>
      ) : null}
      {invite && !member ? (
        <div className="presence presence-on fixed inset-0 z-40 grid place-items-center bg-black/70 px-4">
          <div role="dialog" aria-modal="true" aria-labelledby="convite-titulo" className="w-full max-w-sm overflow-hidden rounded-[18px] border border-line bg-card">
            <h2 id="convite-titulo" className="sr-only">{league.name}</h2>
            <div className="relative h-80 bg-card-2">
              {league.photo ? <img src={league.photo} alt="" className="absolute inset-0 size-full object-cover" /> : null}
              <div className="absolute inset-0 grid place-items-center px-6">
                <button type="button" onClick={accept} disabled={pending} className="h-12 rounded-xl bg-accent px-6 text-base font-bold text-accent-ink disabled:opacity-60">Aceitar convite</button>
              </div>
            </div>
            {message ? <p className="px-4 py-3 text-center text-sm text-accent" role="status">{message}</p> : null}
            <button type="button" onClick={decline} className="w-full py-3 text-sm font-semibold text-muted">Fechar</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function RankLine({ row, host }: { row: RankRow; host?: boolean }) {
  const medal = medalSrc[row.place as 1 | 2 | 3];
  return (
    <li className="grid grid-cols-[28px_1fr_auto] items-center gap-2.5 border-t border-line py-3">
      <span className="grid h-[18px] place-items-center text-[13px] font-semibold text-muted tabular-nums">
        {medal ? <img src={medal} alt="" className="size-4 object-contain" /> : row.place}
        {medal ? <span className="sr-only">{row.place}</span> : null}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <RankAvatar row={row} />
        <b className="truncate text-sm font-semibold">{row.name}</b>
        {row.you ? <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">Você</span> : null}
        {host ? <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-bold text-muted">Anfitrião</span> : null}
      </div>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
        <Coin />
        {row.points}
      </span>
    </li>
  );
}
