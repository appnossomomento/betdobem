import type { Metadata } from "next";
import { Suspense } from "react";
import { CarteiraScreen } from "@/components/CarteiraScreen";
import { getAccount } from "@/lib/account";
import { getRound } from "@/lib/round";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "BETdoBEM — Carteira", description: "Carteira do BETdoBEM" };

export default function CarteiraPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando carteira…</p>}>
      <CarteiraRoute />
    </Suspense>
  );
}

async function CarteiraRoute() {
  const account = await getAccount();
  const supabase = await createClient();
  const [{ data: bets }, { data: ledger }, round] = await Promise.all([
    supabase.from("bets").select("id, stake, combined_odd, potential_return, status, placed_at, week_key, bet_legs(phrase, odd, result, fixture_id, selection_key)").eq("user_id", account?.id ?? "").order("placed_at", { ascending: false }),
    supabase.from("ledger").select("id, kind, amount, created_at").eq("user_id", account?.id ?? "").order("created_at", { ascending: false }),
    getRound(),
  ]);
  const crests = Object.fromEntries(round.games.map((game) => [game.id, { homeLogo: game.homeLogo, awayLogo: game.awayLogo }]));
  return <CarteiraScreen balance={account?.balance ?? 0} closedSaldo={account?.saldoTotal ?? 0} bets={bets ?? []} ledger={ledger ?? []} crests={crests} />;
}
