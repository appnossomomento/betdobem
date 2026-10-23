"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adjustBalance, setBanned, setVip } from "@/lib/admin-actions";

export function UserEditor({ id, vip, banned }: { id: string; vip: boolean; banned: boolean }) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");

  async function run(work: () => Promise<{ ok: boolean }>) {
    const result = await work();
    setMessage(result.ok ? "Feito." : "Não foi possível.");
    if (result.ok) router.refresh();
  }

  return (
    <section className="rounded-2xl border border-line bg-card p-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => run(() => setVip(id, !vip))} className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-accent-ink">{vip ? "Retirar VIP" : "Conceder VIP"}</button>
        <button type="button" onClick={() => run(() => setBanned(id, !banned))} className="rounded-lg bg-card-2 px-3 py-2 text-sm font-semibold">{banned ? "Reativar" : "Banir"}</button>
      </div>
      <form className="mt-3 flex flex-col gap-2" onSubmit={(event) => { event.preventDefault(); run(() => adjustBalance(id, Number(amount.replace(",", ".")), reason)); }}>
        <label className="text-xs text-muted">Ajuste de moedas
          <input value={amount} onChange={(event) => setAmount(event.target.value)} className="mt-1 h-10 w-full rounded-lg bg-card-2 px-3 text-sm outline-none" />
        </label>
        <label className="text-xs text-muted">Motivo
          <input value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1 h-10 w-full rounded-lg bg-card-2 px-3 text-sm outline-none" />
        </label>
        <button className="h-10 rounded-lg bg-card-2 text-sm font-semibold">Lançar ajuste</button>
      </form>
      {message ? <p className="mt-2 text-sm text-accent">{message}</p> : null}
    </section>
  );
}
