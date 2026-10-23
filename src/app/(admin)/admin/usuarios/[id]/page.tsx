import { Suspense } from "react";
import { notFound } from "next/navigation";
import { UserEditor } from "@/components/AdminUsers";
import { loadDirectory, loadTeams } from "@/lib/admin-data";
import { readBoard } from "@/lib/admin-store";
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
  const people = await loadDirectory();
  const person = people.find((item) => item.id === id);
  if (!person) notFound();
  const mates = people.filter((item) => item.team && item.team === person.team);
  const mateBalance = mates.length ? Math.round(mates.reduce((sum, item) => sum + item.balance, 0) / mates.length) : 0;
  const teamHit = (await loadTeams(people)).find((item) => item.team === (person.team || "sem time"))?.hit ?? 0;
  const board = await readBoard();
  const admin = createAdminClient();
  const { data: bets } = await admin.from("bets").select("id, stake, status, combined_odd, placed_at, bet_legs(phrase, selection_key, odd, result)").eq("user_id", id).order("placed_at", { ascending: false }).limit(20);
  const { data: ledger } = await admin.from("ledger").select("kind, amount, created_at").eq("user_id", id).order("created_at", { ascending: false }).limit(20);
  const { data: memberships } = await admin.from("league_members").select("league_id").eq("user_id", id);
  const leagueIds = (memberships ?? []).map((item) => item.league_id);
  const { data: leagueRows } = leagueIds.length ? await admin.from("leagues").select("id, name").in("id", leagueIds) : { data: [] };
  const answered = board.polls.filter((poll) => poll.votes.some((vote) => vote.userId === id));
  const notices = board.notices.filter((notice) => notice.recipients.includes(id));
  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="text-xl">{person.nick}</h1>
        <p className="text-sm text-muted">{person.email}</p>
      </header>
      <section className="rounded-2xl border border-line bg-card p-4 text-sm">
        <p>Idade {person.age ?? "—"} · {person.city || "sem cidade"}</p>
        <p className="mt-1">Time {person.team || "—"} · camisa {person.shirt || "—"} · short {person.bottom || "—"}</p>
        <p className="mt-1">Saldo {person.balance} · apostas {person.bets} · {person.vip ? "VIP" : "sem VIP"}</p>
        <p className="mt-1 text-muted">Média de saldo de quem torce para {person.team || "esse grupo"}: {mateBalance}. Acerto das pernas liquidadas desse time: {teamHit}%.</p>
      </section>
      <UserEditor id={person.id} vip={person.vip} banned={person.banned} />
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Apostas</h2>
        <ul>{(bets ?? []).map((bet) => <li key={bet.id} className="border-t border-line py-2 text-sm">{bet.status} · {bet.stake} · {Number(bet.combined_odd).toFixed(2)}{(bet.bet_legs ?? []).map((leg) => ` · ${leg.phrase}`)}</li>)}</ul>
      </section>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Ligas</h2>
        <ul>{(leagueRows ?? []).map((league) => <li key={league.id} className="border-t border-line py-2 text-sm">{league.name}</li>)}</ul>
      </section>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Enquetes</h2>
        <ul>{answered.map((poll) => <li key={poll.id} className="border-t border-line py-2 text-sm">{poll.question}</li>)}</ul>
      </section>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Avisos</h2>
        <ul>{notices.map((notice) => <li key={notice.id} className="border-t border-line py-2 text-sm">{notice.title}</li>)}</ul>
      </section>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Extrato</h2>
        <ul>{(ledger ?? []).map((entry, index) => <li key={`${entry.created_at}-${index}`} className="border-t border-line py-2 text-sm">{entry.kind} · {entry.amount}</li>)}</ul>
      </section>
    </div>
  );
}
