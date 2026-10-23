"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { closePoll, createPoll, previewSegment, saveSegment, sendNotice, sendPush } from "@/lib/admin-actions";
import { TEAMS } from "@/lib/profile-fields";
import type { Segment } from "@/lib/admin-store";

const field = "mt-1 h-10 w-full rounded-lg bg-card-2 px-3 text-sm outline-none";

export function SegmentForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [team, setTeam] = useState("");
  const [city, setCity] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [vip, setVip] = useState("");
  const [banned, setBanned] = useState("");
  const [days, setDays] = useState("");
  const [never, setNever] = useState(false);
  const [balanceMin, setBalanceMin] = useState("");
  const [balanceMax, setBalanceMax] = useState("");
  const [inLeague, setInLeague] = useState("");
  const [message, setMessage] = useState("");

  function peopleLabel(count: number) {
    return count === 1 ? "1 pessoa entra nesse recorte" : `${count} pessoas entram nesse recorte`;
  }

  function filter() {
    return {
      team: team || undefined,
      city: city || undefined,
      ageMin: ageMin ? Number(ageMin) : undefined,
      ageMax: ageMax ? Number(ageMax) : undefined,
      vip: vip === "" ? undefined : vip === "1",
      banned: banned === "" ? undefined : banned === "1",
      betWithinDays: days ? Number(days) : undefined,
      neverBet: never || undefined,
      balanceMin: balanceMin ? Number(balanceMin) : undefined,
      balanceMax: balanceMax ? Number(balanceMax) : undefined,
      inLeague: inLeague === "" ? undefined : inLeague === "1",
    };
  }

  return (
    <form className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-card p-4" onSubmit={async (event) => {
      event.preventDefault();
      const result = await saveSegment(name, filter());
      setMessage(result.ok ? `Segmento salvo. ${peopleLabel(result.count)}.` : "Não foi possível salvar.");
      if (result.ok) router.refresh();
    }}>
      <label className="text-xs text-muted">Nome<input value={name} onChange={(event) => setName(event.target.value)} className={field} /></label>
      <label className="text-xs text-muted">Time
        <select value={team} onChange={(event) => setTeam(event.target.value)} className={field}><option value="">Qualquer</option>{TEAMS.map((item) => <option key={item}>{item}</option>)}</select>
      </label>
      <label className="text-xs text-muted">Cidade contém<input value={city} onChange={(event) => setCity(event.target.value)} className={field} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Idade mínima<input value={ageMin} onChange={(event) => setAgeMin(event.target.value.replace(/\D/g, ""))} className={field} /></label>
        <label className="text-xs text-muted">Idade máxima<input value={ageMax} onChange={(event) => setAgeMax(event.target.value.replace(/\D/g, ""))} className={field} /></label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">VIP
          <select value={vip} onChange={(event) => setVip(event.target.value)} className={field}><option value="">Qualquer</option><option value="1">Sim</option><option value="0">Não</option></select>
        </label>
        <label className="text-xs text-muted">Banido
          <select value={banned} onChange={(event) => setBanned(event.target.value)} className={field}><option value="">Qualquer</option><option value="1">Sim</option><option value="0">Não</option></select>
        </label>
      </div>
      <label className="text-xs text-muted">Apostou nos últimos dias<input value={days} onChange={(event) => setDays(event.target.value.replace(/\D/g, ""))} className={field} /></label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={never} onChange={(event) => setNever(event.target.checked)} />Nunca apostou</label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Saldo mínimo<input value={balanceMin} onChange={(event) => setBalanceMin(event.target.value.replace(/[^\d]/g, ""))} className={field} /></label>
        <label className="text-xs text-muted">Saldo máximo<input value={balanceMax} onChange={(event) => setBalanceMax(event.target.value.replace(/[^\d]/g, ""))} className={field} /></label>
      </div>
      <label className="text-xs text-muted">Liga
        <select value={inLeague} onChange={(event) => setInLeague(event.target.value)} className={field}><option value="">Qualquer</option><option value="1">Em alguma liga</option><option value="0">Fora de liga</option></select>
      </label>
      <div className="flex gap-2">
        <button type="button" onClick={async () => setMessage(`${peopleLabel(await previewSegment(filter()))}. Nada foi salvo.`)} className="h-10 flex-1 rounded-lg bg-card-2 text-sm font-semibold">Contar</button>
        <button className="h-10 flex-1 rounded-lg bg-accent text-sm font-bold text-accent-ink">Salvar</button>
      </div>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </form>
  );
}

export function PollForm({ segments }: { segments: Segment[] }) {
  const router = useRouter();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState("Sim\nNão");
  const [segmentId, setSegmentId] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-card p-4" onSubmit={async (event) => {
      event.preventDefault();
      const result = await createPoll({ question, options: options.split("\n"), segmentId: segmentId || null, endsAt: endsAt ? new Date(endsAt).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString() });
      setMessage(result.ok ? "Enquete criada." : "Não foi possível.");
      if (result.ok) router.refresh();
    }}>
      <label className="text-xs text-muted">Pergunta<input value={question} onChange={(event) => setQuestion(event.target.value)} className={field} /></label>
      <label className="text-xs text-muted">Opções, uma por linha<textarea value={options} onChange={(event) => setOptions(event.target.value)} className="mt-1 h-24 w-full rounded-lg bg-card-2 px-3 py-2 text-sm outline-none" /></label>
      <label className="text-xs text-muted">Segmento
        <select value={segmentId} onChange={(event) => setSegmentId(event.target.value)} className={field}><option value="">Todos</option>{segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}</select>
      </label>
      <label className="text-xs text-muted">Encerra<input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className={field} /></label>
      <button className="h-10 rounded-lg bg-accent text-sm font-bold text-accent-ink">Criar enquete</button>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </form>
  );
}

export function ClosePoll({ id }: { id: string }) {
  const router = useRouter();
  return <button type="button" onClick={async () => { await closePoll(id); router.refresh(); }} className="text-xs font-semibold text-[#c4292e]">Encerrar</button>;
}

const pushes = [
  { kind: "mercado_aberto" as const, title: "Mercado aberto", body: "Faça suas apostas." },
  { kind: "partidas_iniciando" as const, title: "Partidas iniciando", body: "Faça suas apostas para não perder a rodada." },
];

export function PushButtons() {
  const [pending, setPending] = useState("");
  const [message, setMessage] = useState("");

  async function fire(kind: (typeof pushes)[number]["kind"], title: string) {
    setPending(kind);
    const result = await sendPush(kind);
    setPending("");
    if (!result.ok) {
      setMessage("Não foi possível.");
      return;
    }
    const aparelhos = result.sent === 1 ? "1 aparelho" : `${result.sent} aparelhos`;
    setMessage(result.skipped === "firebase" ? "O Firebase não está configurado neste servidor." : `${title} enviado para ${aparelhos}.`);
  }

  return (
    <div className="mt-4 grid gap-3">
      {pushes.map((item) => (
        <button key={item.kind} type="button" disabled={pending !== ""} onClick={() => fire(item.kind, item.title)} className="rounded-2xl border border-line bg-card p-4 text-left disabled:opacity-60">
          <span className="block text-base font-semibold">{item.title}</span>
          <span className="mt-1 block text-sm text-muted">{item.body}</span>
          <span className="mt-3 inline-flex h-10 items-center rounded-lg bg-accent px-4 text-sm font-bold text-accent-ink">{pending === item.kind ? "Enviando…" : "Disparar"}</span>
        </button>
      ))}
      {message ? <p className="text-sm text-accent" role="status">{message}</p> : null}
    </div>
  );
}

export function NoticeForm({ segments }: { segments: Segment[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segmentId, setSegmentId] = useState("");
  const [message, setMessage] = useState("");
  return (
    <form className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-card p-4" onSubmit={async (event) => {
      event.preventDefault();
      const result = await sendNotice({ title, body, segmentId: segmentId || null });
      setMessage(result.ok ? `Enviado para ${result.sent}.` : "Não foi possível.");
      if (result.ok) router.refresh();
    }}>
      <label className="text-xs text-muted">Título<input value={title} onChange={(event) => setTitle(event.target.value)} className={field} /></label>
      <label className="text-xs text-muted">Texto<textarea value={body} onChange={(event) => setBody(event.target.value)} className="mt-1 h-24 w-full rounded-lg bg-card-2 px-3 py-2 text-sm outline-none" /></label>
      <label className="text-xs text-muted">Segmento
        <select value={segmentId} onChange={(event) => setSegmentId(event.target.value)} className={field}><option value="">Todos</option>{segments.map((segment) => <option key={segment.id} value={segment.id}>{segment.name}</option>)}</select>
      </label>
      <button className="h-10 rounded-lg bg-accent text-sm font-bold text-accent-ink">Enviar</button>
      {message ? <p className="text-sm text-accent">{message}</p> : null}
    </form>
  );
}
