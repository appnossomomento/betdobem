import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LeagueScreen } from "@/components/LeagueScreen";
import { getAccount } from "@/lib/account";
import { loadLeague, loadLeaguePreview } from "@/lib/social";

export const metadata: Metadata = {
  title: "BETdoBEM — Liga",
  description: "Proteja sua banca de moedas fictícias, com reset de patrimônio a cada semana e odds atualizadas!",
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function LeaguePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ convite?: string; aceitar?: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <LeagueRoute params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function LeagueRoute({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ convite?: string; aceitar?: string }> }) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const account = await getAccount();
  const home = account ? "/ranking" : "/jogos";
  if (!uuid.test(id)) redirect(home);
  const memberLeague = account ? await loadLeague(account.id, id) : null;
  if (memberLeague) return <LeagueScreen league={memberLeague} member invite={false} signedIn acceptOnLoad={false} />;
  if (query.convite !== "1") redirect(home);
  const preview = await loadLeaguePreview(id);
  if (!preview) redirect(home);
  return <LeagueScreen league={preview} member={false} invite signedIn={Boolean(account)} acceptOnLoad={query.aceitar === "1" && Boolean(account)} />;
}
