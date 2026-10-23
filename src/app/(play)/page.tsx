import { Suspense } from "react";
import { HomeScreen } from "@/components/HomeScreen";
import { LoginScreen } from "@/components/LoginScreen";
import { getAccount } from "@/lib/account";
import { getRound } from "@/lib/round";
import { loadSocial } from "@/lib/social";

export default function Home() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <HomeGate />
    </Suspense>
  );
}

async function HomeGate() {
  const account = await getAccount();
  if (!account || account.banned) return <LoginScreen banned={Boolean(account?.banned)} />;
  const [round, social] = await Promise.all([getRound(), loadSocial(account.id)]);
  return <HomeScreen games={round.games} cards={round.cards} weeklyRows={social.weekly} monthlyRows={social.monthly} leagueRows={social.mine} />;
}
