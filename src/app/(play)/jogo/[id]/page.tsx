import { Suspense } from "react";
import { GameScreen } from "@/components/GameScreen";
import { getRound } from "@/lib/round";

export default function GamePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando jogo…</p>}>
      <GameRoute params={params} />
    </Suspense>
  );
}

async function GameRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const round = await getRound();
  return <GameScreen game={round.games.find((item) => item.id === id) ?? null} />;
}
