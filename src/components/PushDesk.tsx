"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPushPlan, removePushPlan, savePushRules, sendPush, sendPushText, setPushPlanEnabled } from "@/lib/admin-actions";
import { saoPauloStamp } from "@/lib/push-when";

type Mode = "once" | "daily" | "weekly";
type Plan = {
  id: string;
  title: string;
  body: string;
  mode: Mode;
  time: string | null;
  weekday: number | null;
  enabled: boolean;
  nextAt: string;
  sentAt: string | null;
};

const presets = [
  { kind: "mercado_aberto" as const, title: "Mercado aberto", body: "Faça suas apostas." },
  { kind: "partidas_iniciando" as const, title: "Partidas iniciando", body: "Faça suas apostas para não perder a rodada." },
];

const every = ["Todo domingo", "Toda segunda", "Toda terça", "Toda quarta", "Toda quinta", "Toda sexta", "Todo sábado"];
const field = "mt-1 h-10 w-full rounded-lg bg-card-2 px-3 text-sm outline-none";

export function PushDesk({ ready, morning, kickoff, plans }: { ready: number; morning: boolean; kickoff: boolean; plans: Plan[] }) {
  const router = useRouter();
  const [pending, setPending] = useState("");
  const [note, setNote] = useState("");
  const [title, setTitle] = useState(presets[0].title);
  const [body, setBody] = useState(presets[0].body);
  const [mode, setMode] = useState<Mode>("daily");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("08:00");
  const [weekday, setWeekday] = useState(1);
  const [rules, setRules] = useState({ morning, kickoff });

  function aparelhos(sent: number) {
    return sent === 1 ? "1 aparelho" : `${sent} aparelhos`;
  }

  async function firePreset(kind: (typeof presets)[number]["kind"], label: string) {
    setPending(kind);
    const result = await sendPush(kind);
    setPending("");
    setNote(!result.ok ? "Não foi possível." : result.skipped === "firebase" ? "O Firebase não está configurado neste servidor." : `${label} enviado para ${aparelhos(result.sent)}.`);
  }

  async function fireText() {
    setPending("texto");
    const result = await sendPushText(title, body);
    setPending("");
    setNote(!result.ok ? "Escreva o título e o texto." : result.skipped === "firebase" ? "O Firebase não está configurado neste servidor." : `Enviado para ${aparelhos(result.sent)}.`);
  }

  async function toggle(key: "morning" | "kickoff") {
    const next = { ...rules, [key]: !rules[key] };
    setRules(next);
    const result = await savePushRules(next);
    if (!result.ok) setRules(rules);
    router.refresh();
  }

  async function schedule(event: React.FormEvent) {
    event.preventDefault();
    setPending("agenda");
    const result = await createPushPlan({ title, body, mode, date: date || null, time, weekday });
    setPending("");
    if (!result.ok) {
      setNote(result.error === "dia" ? "Escolha o dia da semana." : result.error === "texto" ? "Escreva o título e o texto." : "Escolha um horário que ainda vai chegar.");
      return;
    }
    setNote("Agendado.");
    router.refresh();
  }

  return (
    <div className="mt-4 flex flex-col gap-6">
      <p className="text-sm text-muted">{ready === 1 ? "1 aparelho com notificação ligada." : `${ready} aparelhos com notificação ligada.`} Conta suspensa fica de fora. Disparar agora sai na hora. O relógio deste plano passa à 00:00 e às 08:00, horário de São Paulo, e um horário marcado sai se essa passagem cair em até 10 minutos dele.</p>

      <section>
        <h2 className="text-base">Regras do mercado</h2>
        <div className="mt-3 grid gap-3">
          <Rule on={rules.morning} label="Todo dia às 08:00, se houver jogo" detail="Mercado aberto. Faça suas apostas." onClick={() => toggle("morning")} />
          <Rule on={rules.kickoff} label="16 minutos antes do primeiro apito" detail="Partidas iniciando. Faça suas apostas para não perder a rodada. Só sai se o relógio passar dentro dessa janela." onClick={() => toggle("kickoff")} />
        </div>
      </section>

      <section>
        <h2 className="text-base">Disparar agora</h2>
        <div className="mt-3 grid gap-3">
          {presets.map((item) => (
            <button key={item.kind} type="button" disabled={pending !== ""} onClick={() => firePreset(item.kind, item.title)} className="rounded-2xl border border-line bg-card p-4 text-left disabled:opacity-60">
              <span className="block font-semibold">{item.title}</span>
              <span className="mt-1 block text-sm text-muted">{item.body}</span>
              <span className="mt-3 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-ink">{pending === item.kind ? "Enviando…" : "Disparar"}</span>
            </button>
          ))}
        </div>
        <form className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-card p-4" onSubmit={(event) => { event.preventDefault(); void fireText(); }}>
          <label className="text-xs text-muted">Título<input value={title} maxLength={80} onChange={(event) => setTitle(event.target.value)} className={field} /></label>
          <label className="text-xs text-muted">Texto<textarea value={body} maxLength={180} onChange={(event) => setBody(event.target.value)} className="mt-1 h-20 w-full rounded-lg bg-card-2 px-3 py-2 text-sm outline-none" /></label>
          <button type="submit" disabled={pending !== ""} className="h-10 rounded-lg bg-card-2 text-sm font-semibold disabled:opacity-60">{pending === "texto" ? "Enviando…" : "Disparar este texto"}</button>
        </form>
      </section>

      <section>
        <h2 className="text-base">Agendar</h2>
        <form className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-card p-4" onSubmit={schedule}>
          <label className="text-xs text-muted">Quando
            <select value={mode} onChange={(event) => setMode(event.target.value as Mode)} className={field}>
              <option value="once">Uma vez</option>
              <option value="daily">Todo dia</option>
              <option value="weekly">Toda semana</option>
            </select>
          </label>
          {mode === "weekly" ? (
            <label className="text-xs text-muted">Dia
              <select value={weekday} onChange={(event) => setWeekday(Number(event.target.value))} className={field}>
                {every.map((label, index) => <option key={label} value={index}>{label}</option>)}
              </select>
            </label>
          ) : null}
          {mode === "once" ? <label className="text-xs text-muted">Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className={field} /></label> : null}
          <label className="text-xs text-muted">Hora de São Paulo<input type="time" value={time} onChange={(event) => setTime(event.target.value)} className={field} /></label>
          <p className="text-sm">{title}</p>
          <p className="text-sm text-muted">{body}</p>
          <button disabled={pending !== ""} className="h-10 rounded-lg bg-accent text-sm font-bold text-accent-ink disabled:opacity-60">{pending === "agenda" ? "Salvando…" : "Agendar"}</button>
        </form>
        <ul className="mt-3">
          {plans.map((plan) => (
            <li key={plan.id} className="border-t border-line py-3">
              <p className="text-sm font-semibold">{plan.title}</p>
              <p className="text-sm text-muted">{plan.body}</p>
              <p className="mt-1 text-xs text-muted">{describe(plan)}{plan.enabled ? ` · próximo ${saoPauloStamp(plan.nextAt)}` : plan.sentAt ? " · enviado" : " · pausado"}</p>
              <div className="mt-2 flex gap-3">
                <button type="button" onClick={async () => { const result = await setPushPlanEnabled(plan.id, !plan.enabled); setNote(result.ok ? "" : "Esse horário já passou."); router.refresh(); }} className="text-sm font-semibold text-accent">{plan.enabled ? "Pausar" : "Retomar"}</button>
                <button type="button" onClick={async () => { await removePushPlan(plan.id); router.refresh(); }} className="text-sm font-semibold text-[#c4292e]">Apagar</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
      {note ? <p className="text-sm text-accent" role="status">{note}</p> : null}
    </div>
  );
}

function Rule({ on, label, detail, onClick }: { on: boolean; label: string; detail: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-line bg-card p-4 text-left">
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${on ? "bg-accent text-accent-ink" : "bg-card-2 text-muted"}`}>{on ? "Ligado" : "Desligado"}</span>
      </span>
      <span className="mt-1 block text-sm text-muted">{detail}</span>
    </button>
  );
}

function describe(plan: Plan) {
  if (plan.mode === "once") return "Uma vez";
  if (plan.mode === "daily") return `Todo dia às ${plan.time}`;
  return `${every[plan.weekday ?? 0]} às ${plan.time}`;
}
