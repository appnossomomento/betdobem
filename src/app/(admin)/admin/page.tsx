import { loadDirectory, loadOverview } from "@/lib/admin-data";

export default async function AdminHome() {
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
        <p className="mt-2 text-sm text-muted">Contas {view.funnel[0]} · apostou alguma vez {view.funnel[1]} · apostou nesta semana {view.funnel[2]}</p>
        <p className="mt-2 text-sm text-muted">Simples {view.single} · múltipla {view.multi}</p>
        <p className="mt-2 text-sm text-muted">Saldo 0: {view.bands[0]} · 1–49: {view.bands[1]} · 50: {view.bands[2]} · 51–100: {view.bands[3]} · mais de 100: {view.bands[4]}</p>
      </section>
      <section className="rounded-2xl border border-line bg-card p-4">
        <h2 className="mb-2 text-[15px]">Cadastros por dia</h2>
        <ul>
          {view.days.map(([day, count]) => (
            <li key={day} className="mb-1 grid grid-cols-[88px_1fr_24px] items-center gap-2 text-xs">
              <span className="text-muted">{day.slice(5)}</span>
              <span className="h-2 rounded-full bg-accent" style={{ width: `${Math.max(8, count * 24)}px` }} />
              <span className="tabular-nums">{count}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
