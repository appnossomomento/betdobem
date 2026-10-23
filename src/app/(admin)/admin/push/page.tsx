import { Suspense } from "react";
import { PushDesk } from "@/components/PushDesk";
import { readBoard } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

export default function AdminPushPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <PushBody />
    </Suspense>
  );
}

async function PushBody() {
  const [board, count] = await Promise.all([
    readBoard(),
    createAdminClient().from("push_subscriptions").select("id", { count: "exact", head: true }),
  ]);
  return (
    <div>
      <h1 className="text-xl">Push</h1>
      <PushDesk ready={count.count ?? 0} morning={board.pushRules.morning} kickoff={board.pushRules.kickoff} plans={board.pushPlans} />
    </div>
  );
}
