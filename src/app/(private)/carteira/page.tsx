import type { Metadata } from "next";
import { Suspense } from "react";
import { CarteiraScreen } from "@/components/CarteiraScreen";
import { getAccount } from "@/lib/account";
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
  const { data: bets } = await supabase.from("bets").select("id, stake, combined_odd, potential_return, status, placed_at, bet_legs(phrase, odd, result)").eq("user_id", account?.id ?? "").order("placed_at", { ascending: false });
  const { data: ledger } = await supabase.from("ledger").select("id, kind, amount, created_at").eq("user_id", account?.id ?? "").order("created_at", { ascending: false });
  return <CarteiraScreen balance={account?.balance ?? 0} closedSaldo={account?.saldoTotal ?? 0} bets={bets ?? []} ledger={ledger ?? []} />;
}
