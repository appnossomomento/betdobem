"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { leagueMarks, leagues, monthly, standingsFromHistory, viewer, weekly, type League, type LeagueVisibility, type RankRow } from "@/data/home";
import { Coin } from "./Icons";

const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long", timeZone: "America/Sao_Paulo" }).format(new Date());

const medalSrc = {
  1: "/medals/gold.png",
  2: "/medals/silver.png",
  3: "/medals/bronze.png",
} as const;

const prizes = [
  { place: 1 as const, title: "Kit do clube", detail: "Tamanho do cadastro" },
  { place: 2 as const, title: "Item do clube", detail: "Outro item" },
  { place: 3 as const, title: "Premiere", detail: "ou Globoplay, 2–3 meses" },
];

const maxLeagues = 3;
const durations = ["1 semana", "2 semanas", "1 mês"] as const;

type LeagueDraft = {
  name: string;
  prize: string;
  photo: string;
  duration: string;
  playerCap: number;
  visibility: LeagueVisibility;
};

type Dialog = { kind: "create" } | { kind: "edit"; name: string } | { kind: "vip" } | null;

export function RankingScreen() {
  const [period, setPeriod] = useState<"Semanal" | "Mensal">("Semanal");
  const [board, setBoard] = useState<League[]>(() => leagues.map((league) => ({ ...league, rows: league.rows.map((row) => ({ ...row })) })));
  const [open, setOpen] = useState<string | null>(leagues[0]?.name ?? null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const rows = period === "Semanal" ? weekly : monthly;
  const you = rows.find((row) => row.you);
  const weekYou = weekly.find((row) => row.you);
  const monthYou = monthly.find((row) => row.you);
  const editing = dialog?.kind === "edit" ? board.find((league) => league.name === dialog.name) : undefined;

  useEffect(() => {
    if (!dialog) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setDialog(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  function openCreate() {
    setDialog(viewer.vip ? { kind: "create" } : { kind: "vip" });
  }

  function createLeague(draft: LeagueDraft) {
    const host = weekYou ?? you;
    if (!host || board.length >= maxLeagues) return;
    const createdAt = new Date().toISOString();
    setBoard((current) => [
      {
        name: draft.name,
        hosted: true,
        prize: draft.prize || undefined,
        photo: draft.photo,
        duration: draft.duration,
        playerCap: draft.playerCap,
        visibility: draft.visibility,
        createdAt,
        history: [],
        rows: [{ ...host, place: 1, points: 0 }],
      },
      ...current,
    ]);
    setOpen(draft.name);
    setDialog(null);
  }

  function saveLeague(draft: LeagueDraft) {
    if (dialog?.kind !== "edit") return;
    const previous = dialog.name;
    setBoard((current) => current.map((league) => (league.name === previous ? { ...league, ...draft, prize: draft.prize || undefined } : league)));
    setOpen(draft.name);
    setDialog(null);
  }

  function leaveLeague(name: string) {
    setBoard((current) => current.filter((league) => league.name !== name));
    setOpen((current) => (current === name ? null : current));
  }

  return (
    <div className="flex flex-col gap-4">
      <header>
        <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">Placar social</p>
        <h1 className="mt-1 text-xl tracking-tight">Ranking</h1>
      </header>

      {you ? (
        <section className="rounded-[18px] border border-line bg-card p-4 shadow-[0_10px_28px_rgba(0,0,0,0.28)]" aria-label="Sua posição">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{period === "Semanal" ? "Esta semana" : "Este mês"}</p>
              <p className="mt-1 text-3xl font-bold tabular-nums">{you.place}º</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Avatar row={you} />
                <b className="text-sm font-semibold">{you.name}</b>
                <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">Você</span>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-2xl font-bold tabular-nums">
                <Coin />
                {you.points}
              </span>
              <p className="mt-1 text-xs text-muted">{period === "Semanal" ? `${monthYou?.place}º no mês` : `${weekYou?.place}º na semana`}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 rounded-full bg-card-2 p-0.5" role="tablist" aria-label="Período">
            {(["Semanal", "Mensal"] as const).map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                aria-selected={period === item}
                onClick={() => setPeriod(item)}
                className={`rounded-full py-1.5 text-sm font-semibold ${period === item ? "bg-accent text-accent-ink" : "text-muted"}`}
              >
                {item}
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-label={`Premiação de ${monthName}`}>
        <h2 className="mb-2 text-[15px] tracking-tight">Premiação de {monthName}</h2>
        <div className="grid grid-cols-3 gap-2">
          {prizes.map((prize) => (
            <article key={prize.place} className="rounded-2xl border border-line bg-card px-2.5 py-3">
              <img src={medalSrc[prize.place]} alt="" className="size-5 object-contain" />
              <p className="mt-2 text-[13px] leading-tight font-semibold">{prize.title}</p>
              <p className="mt-1 text-[11px] leading-tight text-muted">{prize.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-4 min-[880px]:grid-cols-2">
        <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-2 shadow-[0_10px_28px_rgba(0,0,0,0.28)]" aria-labelledby="geral-titulo">
          <h2 id="geral-titulo" className="mb-1 text-[15px] tracking-tight">Ranking geral</h2>
          <p className="mb-2 text-xs text-muted">{period}</p>
          <ol>
            {rows.map((row) => (
              <RankItem key={`${period}-${row.place}-${row.initials}`} row={row} />
            ))}
          </ol>
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="ligas-titulo">
          <div className="flex items-center justify-between gap-3">
            <h2 id="ligas-titulo" className="text-[15px] tracking-tight">Ligas <span className="text-xs font-semibold text-muted">{board.length} de {maxLeagues}</span></h2>
            <button type="button" aria-haspopup="dialog" onClick={openCreate} className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-accent-ink">
              Criar liga
            </button>
          </div>

          {board.map((league) => {
            const expanded = open === league.name;
            const table = league.history ? standingsFromHistory(league) : league.rows;
            const mine = table.find((row) => row.you);
            return (
              <article key={league.name} className="rounded-[18px] border border-line bg-card px-[18px] pt-3 pb-1 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
                <button type="button" aria-expanded={expanded} onClick={() => setOpen(expanded ? null : league.name)} className="flex w-full items-center gap-3 pb-3 text-left">
                  {league.photo ? (
                    <img src={league.photo} alt="" className="h-8 w-10 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <span className="h-8 w-10 shrink-0 rounded-lg" style={{ background: markFor(league) }} />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{league.name}</span>
                    <span className="text-xs text-muted">{league.hosted ? "Você é o anfitrião" : "Você participa"}</span>
                  </span>
                  {mine ? <span className="text-sm font-bold tabular-nums">{mine.place}º</span> : null}
                </button>
                {expanded ? (
                  <>
                    <ol>
                      {table.map((row) => (
                        <RankItem key={`${league.name}-${row.place}-${row.initials}`} row={row} host={Boolean(league.hosted && row.you)} />
                      ))}
                    </ol>
                    <div className="flex justify-end pb-3">
                      {league.hosted ? (
                        <button type="button" onClick={() => setDialog({ kind: "edit", name: league.name })} className="rounded-lg bg-card-2 px-3 py-1.5 text-sm font-semibold text-ink">Administrar</button>
                      ) : (
                        <button type="button" onClick={() => leaveLeague(league.name)} className="rounded-md border border-[#5c1818] px-2 py-0.5 text-[11px] font-semibold text-[#c4292e]">Sair</button>
                      )}
                    </div>
                  </>
                ) : null}
              </article>
            );
          })}
        </section>
      </div>

      {dialog?.kind === "vip" ? (
        <Modal title="Criar liga" onClose={() => setDialog(null)}>
          <p className="mt-2 text-sm text-muted">Criar liga é benefício VIP. A assinatura libera o grupo e o avatar personalizado. O saldo de quem é VIP é o mesmo de todo mundo.</p>
        </Modal>
      ) : null}
      {dialog?.kind === "create" && board.length >= maxLeagues ? (
        <Modal title="Limite de ligas" onClose={() => setDialog(null)}>
          <p className="mt-2 text-sm text-muted">Você já está em {maxLeagues} ligas. Saia de uma para criar outra.</p>
        </Modal>
      ) : null}
      {dialog?.kind === "create" && board.length < maxLeagues ? (
        <Modal title="Nova liga" onClose={() => setDialog(null)}>
          <LeagueForm names={board.map((league) => league.name)} onSubmit={createLeague} onClose={() => setDialog(null)} />
        </Modal>
      ) : null}
      {dialog?.kind === "edit" && editing ? (
        <Modal title="Administrar liga" onClose={() => setDialog(null)}>
          <LeagueForm
            names={board.map((league) => league.name).filter((name) => name !== editing.name)}
            initial={editing}
            onSubmit={saveLeague}
            onClose={() => setDialog(null)}
            onEnd={() => leaveLeague(editing.name)}
          />
        </Modal>
      ) : null}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-black/70 px-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-labelledby="liga-dialog-titulo" className="max-h-[min(680px,calc(100vh-32px))] w-full max-w-md overflow-y-auto rounded-[18px] border border-line bg-card p-4 shadow-[0_10px_28px_rgba(0,0,0,0.28)]" onMouseDown={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h2 id="liga-dialog-titulo" className="text-base font-semibold">{title}</h2>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-sm font-semibold text-muted">Fechar</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LeagueForm({ names, initial, onSubmit, onClose, onEnd }: { names: string[]; initial?: League; onSubmit: (draft: LeagueDraft) => void; onClose: () => void; onEnd?: () => void }) {
  const nameRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial?.name ?? "");
  const [prize, setPrize] = useState(initial?.prize ?? "");
  const [photo, setPhoto] = useState(initial?.photo ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? durations[0]);
  const [playerCap, setPlayerCap] = useState(String(initial?.playerCap ?? 10));
  const [visibility, setVisibility] = useState<LeagueVisibility>(initial?.visibility ?? "privada");
  const [error, setError] = useState("");

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  function onFile(file: File | undefined) {
    if (!file) return;
    const types = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const named = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if ((!types.includes(file.type) && !named) || (file.type && !types.includes(file.type)) || file.size > 2 * 1024 * 1024) {
      setError("Use JPG, PNG, WEBP ou GIF de até 2 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (!img.naturalWidth || !img.naturalHeight || ratio < 0.6 || ratio > 1.7) {
        URL.revokeObjectURL(url);
        setError("A imagem precisa ser quase quadrada.");
        return;
      }
      setPhoto((current) => {
        if (current.startsWith("blob:") && current !== initial?.photo) URL.revokeObjectURL(current);
        return url;
      });
      setError("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError("Não foi possível ler essa imagem.");
    };
    img.src = url;
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const next = name.trim();
    const cap = Number(playerCap);
    if (!next) {
      setError("Dê um nome para a liga.");
      return;
    }
    if (names.some((item) => item.toLowerCase() === next.toLowerCase())) {
      setError("Já existe uma liga com esse nome.");
      return;
    }
    if (!photo) {
      setError("Inclua uma foto da liga.");
      return;
    }
    if (!Number.isInteger(cap) || cap < 2 || cap > 100) {
      setError("A liga cabe entre 2 e 100 players.");
      return;
    }
    if (initial && cap < initial.rows.length) {
      setError(`A liga já tem ${initial.rows.length} pessoas.`);
      return;
    }
    onSubmit({ name: next, prize: prize.trim(), photo, duration, playerCap: cap, visibility });
  }

  return (
    <form onSubmit={submit} className="mt-3">
      <button type="button" onClick={() => fileRef.current?.click()} className="grid h-16 w-full place-items-center overflow-hidden rounded-xl bg-card-2 text-sm font-semibold text-muted">
        {photo ? <img src={photo} alt="Foto da liga" className="size-full object-cover" /> : "Incluir foto"}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      <label className="mt-3 block text-xs text-muted" htmlFor="liga-nome">Nome</label>
      <input ref={nameRef} id="liga-nome" value={name} maxLength={32} onChange={(event) => { setName(event.target.value); setError(""); }} className="mt-1 w-full rounded-lg bg-card-2 px-2 py-2 text-base font-semibold text-ink outline-none" />
      <label className="mt-3 block text-xs text-muted" htmlFor="liga-duracao">Duração</label>
      <select id="liga-duracao" value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-1 w-full rounded-lg bg-card-2 px-2 py-2 text-base text-ink outline-none">
        {durations.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
      <label className="mt-3 block text-xs text-muted" htmlFor="liga-players">Quantidade de players</label>
      <input id="liga-players" inputMode="numeric" value={playerCap} onChange={(event) => setPlayerCap(event.target.value.replace(/\D/g, "").slice(0, 3))} className="mt-1 w-full rounded-lg bg-card-2 px-2 py-2 text-base font-semibold text-ink outline-none" />
      <p className="mt-3 text-xs text-muted">Visibilidade</p>
      <div className="mt-1 grid grid-cols-2 gap-2">
        {(["privada", "publica"] as const).map((item) => (
          <button key={item} type="button" aria-pressed={visibility === item} onClick={() => setVisibility(item)} className={`rounded-lg px-2 py-2 text-sm font-semibold ${visibility === item ? "bg-accent text-accent-ink" : "bg-card-2 text-ink"}`}>
            {item === "privada" ? "Privada" : "Pública"}
          </button>
        ))}
      </div>
      <label className="mt-3 block text-xs text-muted" htmlFor="liga-premio">Premiação por fora, opcional</label>
      <input id="liga-premio" value={prize} maxLength={80} placeholder="Ex.: jantar de quem ficar por último" onChange={(event) => setPrize(event.target.value)} className="mt-1 w-full rounded-lg bg-card-2 px-2 py-2 text-base text-ink outline-none placeholder:text-muted" />
      {error ? <p className="mt-2 text-xs text-accent" role="status">{error}</p> : null}
      <div className="mt-4 flex items-center justify-between gap-2">
        {onEnd ? <button type="button" onClick={() => { onEnd(); onClose(); }} className="text-sm font-semibold text-[#c4292e]">Encerrar liga</button> : <span />}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-2 text-sm font-semibold text-muted">Cancelar</button>
          <button type="submit" className="rounded-lg bg-accent px-3 py-2 text-sm font-bold text-accent-ink">{initial ? "Salvar" : "Criar"}</button>
        </div>
      </div>
    </form>
  );
}

function RankItem({ row, host }: { row: RankRow; host?: boolean }) {
  const medal = medalSrc[row.place as 1 | 2 | 3];
  return (
    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-2.5 border-t border-line py-2.5">
      <span className="grid h-[18px] place-items-center text-[13px] font-semibold text-muted tabular-nums">
        {medal ? <img src={medal} alt="" className="size-4 object-contain" /> : row.place}
        {medal ? <span className="sr-only">{row.place}</span> : null}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <Avatar row={row} />
        <b className="truncate text-sm font-semibold">{row.name}</b>
        {row.you ? <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">Você</span> : null}
        {host ? <span className="rounded-md border border-line px-1.5 py-0.5 text-[11px] font-bold text-muted">Anfitrião</span> : null}
      </div>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
        <Coin />
        {row.points}
      </span>
    </li>
  );
}

function Avatar({ row }: { row: RankRow }) {
  return (
    <svg viewBox="0 0 32 32" className="size-[26px] shrink-0" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill={row.color} />
      <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="700" fill={row.ink} fontFamily="Outfit, sans-serif">{row.initials}</text>
    </svg>
  );
}

function markFor(league: League) {
  if (league.hosted) return "linear-gradient(90deg, #1a2208 0 34%, #d6f25c 34% 67%, #6f8f2a 67% 100%)";
  const index = leagues.findIndex((item) => item.name === league.name);
  return leagueMarks[index] ?? leagueMarks[0];
}
