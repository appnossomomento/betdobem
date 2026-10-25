"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { followLive, liveLeadMs } from "@/lib/market";
import { useMarketNow } from "./MarketClock";

const pulseMs = 12_000;

export function LivePulse({ games }: { games: { kickoff: string; finished: boolean; live: boolean }[] }) {
  const now = useMarketNow();
  const on = games.some((game) => followLive(game.kickoff, game.finished, game.live, now));
  const router = useRouter();

  // No horário exato do kickoff (e 2 min antes), dispara refresh mesmo sem o intervalo.
  useEffect(() => {
    const timers: number[] = [];
    const arm = (at: number) => {
      const wait = at - Date.now();
      if (wait < 0 || wait > 8 * 60 * 60 * 1000) return;
      timers.push(
        window.setTimeout(() => {
          if (document.visibilityState === "visible") router.refresh();
        }, wait),
      );
    };
    for (const game of games) {
      if (game.finished) continue;
      const kick = Date.parse(game.kickoff);
      if (!Number.isFinite(kick)) continue;
      arm(kick - liveLeadMs);
      arm(kick);
      arm(kick + 30_000);
    }
    return () => {
      for (const id of timers) window.clearTimeout(id);
    };
  }, [games, router]);

  useEffect(() => {
    if (!on) return;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    refresh();
    const id = window.setInterval(refresh, pulseMs);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [on, router]);

  return null;
}
