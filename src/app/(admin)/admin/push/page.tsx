import { Suspense } from "react";
import { PushButtons } from "@/components/AdminForms";
import { createAdminClient } from "@/lib/supabase/admin";

export default function AdminPushPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <PushBody />
    </Suspense>
  );
}

async function PushBody() {
  const admin = createAdminClient();
  const { count } = await admin.from("push_subscriptions").select("id", { count: "exact", head: true });
  const ready = count ?? 0;
  return (
    <div>
      <h1 className="text-xl">Push</h1>
      <p className="mt-2 text-sm text-muted">{ready === 1 ? "1 aparelho com notificação ligada." : `${ready} aparelhos com notificação ligada.`} Conta suspensa fica de fora.</p>
      <PushButtons />
    </div>
  );
}
