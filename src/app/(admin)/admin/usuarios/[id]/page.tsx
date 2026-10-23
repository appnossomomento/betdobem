import { Suspense } from "react";
import { notFound } from "next/navigation";
import { UserEditor } from "@/components/AdminUsers";
import { loadDirectory } from "@/lib/admin-data";
import { ZONE } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <UserBody params={params} />
    </Suspense>
  );
}

async function UserBody({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = (await loadDirectory()).find((item) => item.id === id);
  if (!person) notFound();
  const admin = createAdminClient();
  const { data: bets } = await admin.from("bets").select("id, stake, status, combined_odd, placed_at, bet_legs(phrase)").eq("user_id", id).order("placed_at", { ascending: false }).limit(20);
  const { data: ledger } = await admin.from("ledger").select("kind, amount, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20);
  const { data: memberships } = await admin.from("league_members").select("league_id").eq("user_id", id);
  const leagueIds = [...new Set((memberships ?? []).map((item) => item.league_id).filter((leagueId): leagueId is string => typeof leagueId === "string" && leagueId.length > 0))];
  const { data: leagueRows } = leagueIds.length
    ? await admin.from("leagues").select("id, name").in("id", leagueIds).eq("status", "active")
    : { data: [] as { id: string; name: string }[] };
  const leagues = (leagueRows ?? []).filter((league) => leagueIds.includes(league.id));
  const facts = [
    ["Idade", person.age ?? "—"],
    ["Cidade", person.city || "—"],
    ["Time", person.team || "—"],
    ["Camisa", person.shirt || "—"],
    ["Short", person.bottom || "—"],
    ["Saldo", person.balance],
    ["Apostas", person.bets],
    ["VIP", person.vip ? "Sim" : "Não"],
  ];

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl">{person.nick}</h1>
        <p className="text-sm text-muted">{person.email}</p>
      </header>
      <section className="grid grid-cols-2 gap-2 min-[880px]:grid-cols-4">
        {facts.map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-line bg-card px-3 py-2.5">
            <p className="text-[11px] text-muted">{label}</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
          </article>
        ))}
      </section>
      <UserEditor id={person.id} vip={person.vip} banned={person.banned} />
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Apostas</h2>
        {(bets ?? []).length === 0 ? <p className="mt-3 text-sm text-muted">Nenhuma aposta.</p> : (
          <ul className="mt-2">
            {(bets ?? []).map((bet) => (
              <li key={bet.id} className="border-t border-line py-3">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <b className="font-semibold">{statusLabel(bet.status)}</b>
                  <span className="text-xs text-muted tabular-nums">{when(bet.placed_at)}</span>
                </div>
                <p className="mt-1 text-sm tabular-nums">{Number(bet.stake)} · {Number(bet.combined_odd).toFixed(2)}</p>
                <p className="mt-1 text-xs text-muted">{legPhrases(bet.bet_legs).join(" · ")}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      {leagues.length > 0 ? (
        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[15px]">Ligas</h2>
          <ul className="mt-2">
            {leagues.map((league) => <li key={league.id} className="border-t border-line py-2.5 text-sm">{league.name}</li>)}
          </ul>
        </section>
      ) : null}
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Extrato</h2>
        {(ledger ?? []).length === 0 ? <p className="mt-3 text-sm text-muted">Nenhum lançamento.</p> : (
          <ul className="mt-2">
            {(ledger ?? []).map((entry, index) => (
              <li key={`${entry.created_at}-${index}`} className="flex items-baseline justify-between gap-3 border-t border-line py-2.5 text-sm">
                <span>{kindLabel(entry.kind)}</span>
                <span className="text-right">
                  <b className="font-semibold tabular-nums">{signed(entry.amount)}</b>
                  <span className="mt-0.5 block text-xs text-muted tabular-nums">{when(entry.created_at)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function legPhrases(legs: { phrase: string }[] | { phrase: string } | null) {
  if (!legs) return [];
  return (Array.isArray(legs) ? legs : [legs]).map((leg) => leg.phrase);
}

function statusLabel(status: string) {
  if (status === "open") return "Aberta";
  if (status === "won") return "Ganha";
  if (status === "lost") return "Perdida";
  if (status === "void") return "Anulada";
  return status;
}

function kindLabel(kind: string) {
  if (kind === "stake") return "Aposta";
  if (kind === "payout") return "Retorno";
  if (kind === "reset") return "Reset";
  if (kind === "marco_zero") return "Marco zero";
  if (kind === "ajuste") return "Ajuste";
  return kind;
}

function signed(amount: number | string) {
  const value = Number(amount);
  const text = value.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return value > 0 ? `+${text}` : text;
}

function when(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: ZONE }).format(time);
}
