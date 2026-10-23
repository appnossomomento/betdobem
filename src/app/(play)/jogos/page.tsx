import type { Metadata } from "next";
import { Suspense } from "react";
import { GamesScreen } from "@/components/GamesScreen";
import { getRound } from "@/lib/round";

export const metadata: Metadata = {
  title: "BETdoBEM — Jogos",
  description: "Jogos da rodada no BETdoBEM",
};

export default function JogosPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando rodada…</p>}>
      <JogosRoute />
    </Suspense>
  );
}

async function JogosRoute() {
  const round = await getRound();
  return <GamesScreen games={round.games} />;
}
