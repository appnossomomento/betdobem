import { connection } from "next/server";
import { Suspense } from "react";
import { PushDesk } from "@/components/PushDesk";
import { loadDirectory } from "@/lib/admin-data";
import { readBoard } from "@/lib/admin-store";
import { saoPauloDay } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";

export default function AdminPushPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <PushBody />
    </Suspense>
  );
}

async function PushBody() {
  await connection();
  const admin = createAdminClient();
  const day = saoPauloDay(Date.now());
  const [board, people, subscriptions, deliveries] = await Promise.all([
    readBoard(),
    loadDirectory(),
    admin.from("push_subscriptions").select("user_id"),
    admin.from("push_deliveries").select("id", { count: "exact", head: true }).eq("day", day).eq("status", "sent"),
  ]);
  const pushUsers = new Set((subscriptions.data ?? []).map((row) => row.user_id as string));
  const active = people.filter((person) => !person.banned);
  const withPush = active.filter((person) => pushUsers.has(person.id)).length;
  const cards = [
    ["Aparelhos ligados", subscriptions.data?.length ?? 0],
    ["Usuários com push", withPush],
    ["Usuários ativos", active.length],
    ["Sem push", active.length - withPush],
    ["Envios hoje", deliveries.count ?? 0],
    ["Agendados", board.pushPlans.filter((plan) => plan.enabled).length],
  ];
  return (
    <div>
      <h1 className="text-xl">Push</h1>
      <div className="mt-4 grid grid-cols-2 gap-2 min-[880px]:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-line bg-card p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </article>
        ))}
      </div>
      <PushDesk morning={board.pushRules.morning} kickoff={board.pushRules.kickoff} plans={board.pushPlans} />
    </div>
  );
}
