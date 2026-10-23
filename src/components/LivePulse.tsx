"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { followLive } from "@/lib/market";
import { useMarketNow } from "./MarketClock";

export function LivePulse({ games }: { games: { kickoff: string; finished: boolean; live: boolean }[] }) {
  const now = useMarketNow();
  const on = games.some((game) => followLive(game.kickoff, game.finished, game.live, now));
  const router = useRouter();

  useEffect(() => {
    if (!on) return;
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const id = window.setInterval(refresh, 20_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [on, router]);

  return null;
}
