import type { Metadata } from "next";
import { Suspense } from "react";
import { RankingScreen } from "@/components/RankingScreen";
import { getAccount } from "@/lib/account";
import { loadSocial } from "@/lib/social";

export const metadata: Metadata = {
  title: "BETdoBEM — Ranking",
  description: "Ranking geral e ligas do BETdoBEM",
};

export default function RankingPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando ranking…</p>}>
      <RankingRoute />
    </Suspense>
  );
}

async function RankingRoute() {
  const account = await getAccount();
  const social = await loadSocial(account?.id ?? "");
  return <RankingScreen weeklyRows={social.weekly} monthlyRows={social.monthly} initialLeagues={social.mine} openLeagues={social.open} vip={Boolean(account?.vip)} />;
}
