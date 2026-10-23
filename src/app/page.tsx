import { Suspense } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { getRound } from "@/lib/round";

export default function Home() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando rodada…</p>}>
      <HomeRoute />
    </Suspense>
  );
}

async function HomeRoute() {
  const round = await getRound();
  return <HomeScreen games={round.games} cards={round.cards} />;
}
