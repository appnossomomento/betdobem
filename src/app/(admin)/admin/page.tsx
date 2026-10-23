import { Suspense } from "react";
import { loadDirectory, loadOverview } from "@/lib/admin-data";

export default function AdminHome() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Carregando…</p>}>
      <AdminHomeBody />
    </Suspense>
  );
}

async function AdminHomeBody() {
  const people = await loadDirectory();
  const view = await loadOverview(people);
  const cards = [
    ["Contas", view.accounts],
    ["Ligas ativas", view.leagues],
    ["Novas em 7 dias", view.recentAccounts],
    ["VIPs", view.vips],
    ["Banidos", view.banned],
    ["Apostas abertas", view.openBets],
    ["Apostas na semana", view.weekBets],
    ["Moedas em 7 dias", view.staked],
    ["Saldo médio", view.average],
  ];
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl">Visão</h1>
      <div className="grid grid-cols-2 gap-2 min-[880px]:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="rounded-2xl border border-line bg-card p-3">
            <p className="text-xs text-muted">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
          </article>
        ))}
      </div>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="text-[15px]">Funil</h2>
        <div className="mt-3 flex flex-col gap-2">
          <Bar label="Contas" value={view.funnel[0]} max={view.funnel[0]} />
          <Bar label="Já apostou" value={view.funnel[1]} max={view.funnel[0]} />
          <Bar label="Nesta semana" value={view.funnel[2]} max={view.funnel[0]} />
        </div>
      </section>
      <div className="grid gap-4 min-[880px]:grid-cols-2">
        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[15px]">Apostas</h2>
          <div className="mt-3 flex flex-col gap-2">
            <Bar label="Simples" value={view.single} max={view.single + view.multi} />
            <Bar label="Múltipla" value={view.multi} max={view.single + view.multi} />
          </div>
        </section>
        <section className="rounded-2xl border border-line bg-card p-4">
          <h2 className="text-[15px]">Saldos</h2>
          <div className="mt-3 flex flex-col gap-2">
            <Bar label="0" value={view.bands[0]} max={view.accounts} />
            <Bar label="1–49" value={view.bands[1]} max={view.accounts} />
            <Bar label="50" value={view.bands[2]} max={view.accounts} />
            <Bar label="51–100" value={view.bands[3]} max={view.accounts} />
            <Bar label="100+" value={view.bands[4]} max={view.accounts} />
          </div>
        </section>
      </div>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-3 text-[15px]">Cadastros por dia</h2>
        <ul>
          {view.days.map(([day, count]) => (
            <li key={day} className="mb-1.5 grid grid-cols-[52px_1fr_24px] items-center gap-2 text-xs">
              <span className="text-muted">{day.slice(5)}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-card-2">
                <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(count ? 8 : 0, (count / Math.max(...view.days.map((item) => item[1]), 1)) * 100)}%` }} />
              </span>
              <span className="text-right tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(value > 0 ? 4 : 0, (value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[92px_1fr_36px] items-center gap-2">
      <span className="text-xs text-muted">{label}</span>
      <span className="h-3 overflow-hidden rounded-full bg-card-2">
        <span className="block h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
      </span>
      <span className="text-right text-xs font-semibold tabular-nums">{value}</span>
    </div>
  );
}
