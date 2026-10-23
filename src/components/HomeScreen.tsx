"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  champs,
  leagueMarks,
  oddFor,
  phraseFor,
  type League,
  type OddGame,
  type RankRow,
  type RoundCard,
  type Side,
} from "@/data/home";
import { useBet } from "./BetContext";
import { Chevron, Coin } from "./Icons";

export function HomeScreen({ games, cards, weeklyRows, monthlyRows, leagueRows, poll = null }: { games: OddGame[]; cards: RoundCard[]; weeklyRows: RankRow[]; monthlyRows: RankRow[]; leagueRows: League[]; poll?: ReactNode }) {
  const { picks, choose } = useBet();
  const [period, setPeriod] = useState<"Semanal" | "Mensal">("Semanal");
  const [champ, setChamp] = useState(1);
  const [league, setLeague] = useState(0);
  const [rankingOpen, setRankingOpen] = useState(false);
  const [leaguesOpen, setLeaguesOpen] = useState(false);
  const leftRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLElement>(null);
  const rows = period === "Semanal" ? weeklyRows : monthlyRows;
  const filter = champs[champ].id;
  const visible = filter === "todos" ? games : games.filter((game) => game.champ === filter);

  useEffect(() => {
    const left = leftRef.current;
    const board = boardRef.current;
    if (!left || !board) return;

    const pin = () => {
      const wide = window.matchMedia("(min-width: 880px)").matches;
      board.style.height = wide ? `${Math.round(left.getBoundingClientRect().height)}px` : "";
    };

    pin();
    const observer = new ResizeObserver(pin);
    observer.observe(left);
    window.addEventListener("resize", pin);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", pin);
    };
  }, []);

  function chooseSide(game: OddGame, side: Side) {
    const odd = oddFor(game, side);
    if (odd == null) return;
    choose(game.id, { key: side, odd, phrase: phraseFor(game, side), competition: game.competition, when: game.when });
  }

  return (
    <>
      <RoundStrip cards={cards} />
      {poll}

      <div className="grid grid-cols-1 items-start gap-4 min-[880px]:grid-cols-[1.15fr_0.85fr]">
        <div ref={leftRef} className="order-2 flex flex-col gap-4 min-[880px]:order-1">
          <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-2 shadow-[0_10px_28px_rgba(0,0,0,0.28)]" aria-labelledby="ranking-titulo">
            <div className="mb-4 hidden min-h-10 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 min-[880px]:grid">
              <h2 id="ranking-titulo" className="text-[15px] tracking-tight">Ranking</h2>
              <Switch
                label={period}
                onPrev={() => setPeriod((current) => (current === "Semanal" ? "Mensal" : "Semanal"))}
                onNext={() => setPeriod((current) => (current === "Semanal" ? "Mensal" : "Semanal"))}
                prevLabel="Ranking anterior"
                nextLabel="Próximo ranking"
              />
            </div>
            <button type="button" className="flex w-full items-center justify-between min-[880px]:hidden" aria-expanded={rankingOpen} onClick={() => setRankingOpen((open) => !open)}>
              <span className="text-[15px] tracking-tight">Ranking</span>
              <span className={`text-muted ${rankingOpen ? "rotate-180" : ""}`}>
                <Chevron dir="down" />
              </span>
            </button>
            <div className={rankingOpen ? "max-[879px]:mt-4" : "hidden min-[880px]:block"}>
            <div className="mb-4 flex justify-end min-[880px]:hidden">
              <Switch
                label={period}
                onPrev={() => setPeriod((current) => (current === "Semanal" ? "Mensal" : "Semanal"))}
                onNext={() => setPeriod((current) => (current === "Semanal" ? "Mensal" : "Semanal"))}
                prevLabel="Ranking anterior"
                nextLabel="Próximo ranking"
              />
            </div>
            <ol>
              {rows.length === 0 ? <li className="border-t border-line py-6 text-sm text-muted">Ninguém no ranking ainda</li> : rows.map((row) => (
                <RankItem key={`${period}-${row.place}-${row.initials}`} row={row} />
              ))}
            </ol>
            </div>
          </section>

          <LeagueBoard
            index={league}
            open={leaguesOpen}
            onToggle={() => setLeaguesOpen((open) => !open)}
            leagues={leagueRows}
            onCycle={(dir) => {
              if (leagueRows.length === 0) return;
              setLeague((current) => (current + dir + leagueRows.length) % leagueRows.length);
            }}
          />
        </div>

        <section ref={boardRef} className="order-1 flex flex-col overflow-hidden rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-2 shadow-[0_10px_28px_rgba(0,0,0,0.28)] min-[880px]:order-2" aria-labelledby="odds-titulo">
          <div className="mb-4 grid min-h-10 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
            <h2 id="odds-titulo" className="text-[15px] tracking-tight">Odds da rodada</h2>
            <Switch
              label={champs[champ].label}
              narrow
              onPrev={() => setChamp((index) => (index + champs.length - 1) % champs.length)}
              onNext={() => setChamp((index) => (index + 1) % champs.length)}
              prevLabel="Campeonato anterior"
              nextLabel="Próximo campeonato"
            />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {visible.map((game) => (
              <article key={game.id} className="border-t border-line py-2.5">
                <span className="text-xs text-muted tabular-nums">{game.when}</span>
                <div className="mt-1.5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                  <div className="min-w-0">
                    <CrestName name={game.home} logo={game.homeLogo} />
                    <CrestName name={game.away} logo={game.awayLogo} />
                    {filter === "todos" ? <p className="mt-1 text-xs text-muted">{game.competition}</p> : null}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    {game.one != null ? <OddButton side="1" value={game.one} selected={picks[game.id]?.key === "1"} onChoose={() => chooseSide(game, "1")} /> : null}
                    {game.draw != null ? <OddButton side="X" value={game.draw} selected={picks[game.id]?.key === "X"} onChoose={() => chooseSide(game, "X")} /> : null}
                    {game.two != null ? <OddButton side="2" value={game.two} selected={picks[game.id]?.key === "2"} onChoose={() => chooseSide(game, "2")} /> : null}
                    <Link href={`/jogo/${game.id}`} className="col-span-3 flex items-center justify-center rounded-lg bg-card-2 px-2 py-1.5 text-xs font-semibold text-ink">
                      Placar
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function RoundStrip({ cards }: { cards: RoundCard[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = scroller.current;
    if (!node) return;
    const card = node.children[0] as HTMLElement | undefined;
    if (!card) return;
    if (node.scrollWidth <= node.clientWidth + 1) {
      node.scrollLeft = 0;
      return;
    }
    node.scrollLeft = Math.max(0, card.offsetLeft - (node.clientWidth - card.offsetWidth) / 2);
  }, [cards]);

  function go(dir: number) {
    const node = scroller.current;
    if (!node) return;
    const card = node.querySelector("article");
    const gap = 12;
    const step = (card?.getBoundingClientRect().width ?? node.clientWidth) + gap;
    node.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  return (
    <section aria-labelledby="jogos-titulo">
      <div className="mb-2.5 grid grid-cols-[32px_minmax(0,1fr)_32px] items-center gap-2">
        <span />
        <h2 id="jogos-titulo" className="text-center text-[15px] tracking-tight">Jogos da rodada</h2>
        <span />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Jogo anterior" onClick={() => go(-1)} className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-card-2 text-ink">
          <Chevron dir="left" />
        </button>
        <div ref={scroller} className="flex min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cards.map((card) => (
            <article key={`${card.home}-${card.away}`} className="flex w-[min(100%,320px)] shrink-0 snap-center flex-col gap-3 rounded-[18px] border border-line bg-card p-4 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{card.league}</span>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${card.live ? "bg-accent text-accent-ink" : "bg-card-2 text-ink"}`}>{card.live ? "Ao vivo" : "Pré-jogo"}</span>
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                <Team name={card.home} logo={card.homeLogo} />
                <span className="text-[22px] font-bold tracking-tight tabular-nums">{card.score}</span>
                <Team name={card.away} logo={card.awayLogo} away />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] text-muted tabular-nums">{card.when}</span>
                <span className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">{card.venue}</span>
              </div>
            </article>
          ))}
        </div>
        <button type="button" aria-label="Próximo jogo" onClick={() => go(1)} className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-card-2 text-ink">
          <Chevron dir="right" />
        </button>
      </div>
    </section>
  );
}

function LeagueBoard({ leagues, index, open, onToggle, onCycle }: { leagues: League[]; index: number; open: boolean; onToggle: () => void; onCycle: (dir: number) => void }) {
  const league = leagues[index];
  const [photos, setPhotos] = useState<(string | null)[]>([null, null, null]);
  const [note, setNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  if (!league) {
    return (
      <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-2 shadow-[0_10px_28px_rgba(0,0,0,0.28)]" aria-label="Ligas">
        <button type="button" className="flex w-full items-center justify-between min-[880px]:hidden" aria-expanded={open} onClick={onToggle}>
          <span className="text-[15px] tracking-tight">Ligas</span>
          <span className={`text-muted ${open ? "rotate-180" : ""}`}>
            <Chevron dir="down" />
          </span>
        </button>
        <div className={open ? "max-[879px]:mt-4" : "hidden min-[880px]:block"}>
          <h2 className="mb-4 hidden text-[15px] tracking-tight min-[880px]:block">Ligas</h2>
          <p className="border-t border-line py-6 text-sm text-muted">Nenhuma liga</p>
        </div>
      </section>
    );
  }
  const photo = photos[index];

  function onFile(file: File | undefined) {
    if (!file) return;
    const types = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const named = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if ((!types.includes(file.type) && !named) || (file.type && !types.includes(file.type)) || file.size > 2 * 1024 * 1024) {
      setNote("Use JPG, PNG, WEBP ou GIF de até 2 MB.");
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = img.naturalWidth / img.naturalHeight;
      if (!img.naturalWidth || !img.naturalHeight || ratio < 0.6 || ratio > 1.7) {
        URL.revokeObjectURL(url);
        setNote("A imagem precisa ser quase quadrada.");
        return;
      }
      setPhotos((current) => {
        const next = [...current];
        if (next[index]) URL.revokeObjectURL(next[index]);
        next[index] = url;
        return next;
      });
      setNote("");
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setNote("Não foi possível ler essa imagem.");
    };
    img.src = url;
  }

  return (
    <section className="rounded-[18px] border border-line bg-card px-[18px] pt-4 pb-2 shadow-[0_10px_28px_rgba(0,0,0,0.28)]" aria-label="Ligas">
      <button type="button" className="flex w-full items-center justify-between min-[880px]:hidden" aria-expanded={open} onClick={onToggle}>
        <span className="text-[15px] tracking-tight">Ligas</span>
        <span className={`text-muted ${open ? "rotate-180" : ""}`}>
          <Chevron dir="down" />
        </span>
      </button>
      <div className={open ? "max-[879px]:mt-4" : "hidden min-[880px]:block"}>
      <div className="mb-4 grid min-h-10 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
        <button
          type="button"
          aria-label={`Enviar imagem de ${league.name}`}
          onClick={() => inputRef.current?.click()}
          className="relative h-10 w-[84px] overflow-hidden rounded-xl"
        >
          {photo ? (
            <img src={photo} alt={league.name} className="absolute inset-0 size-full object-cover" />
          ) : (
            <span className="absolute inset-0" style={{ background: leagueMarks[index] }} />
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          className="hidden"
          onChange={(event) => {
            onFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
        <Switch
          label={league.name}
          narrow
          onPrev={() => { setNote(""); onCycle(-1); }}
          onNext={() => { setNote(""); onCycle(1); }}
          prevLabel="Liga anterior"
          nextLabel="Próxima liga"
        />
      </div>
      {note ? <p className="-mt-2 mb-2 text-xs text-muted" role="status">{note}</p> : null}
      <ol>
        {league.rows.map((row) => (
          <RankItem key={`${league.name}-${row.place}-${row.initials}`} row={row} />
        ))}
      </ol>
      </div>
    </section>
  );
}

function Team({ name, logo, away }: { name: string; logo: string; away?: boolean }) {
  return (
    <div className={`flex min-w-0 items-center gap-2 text-[15px] font-semibold ${away ? "justify-end" : ""}`}>
      {away ? <span className="truncate">{name}</span> : <img src={logo} alt="" className="size-7 shrink-0 object-contain" />}
      {away ? <img src={logo} alt="" className="size-7 shrink-0 object-contain" /> : <span className="truncate">{name}</span>}
    </div>
  );
}

function CrestName({ name, logo }: { name: string; logo: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5 leading-snug">
      <img src={logo} alt="" className="size-3 object-contain" />
      <b className="truncate text-sm font-semibold">{name}</b>
    </span>
  );
}

function OddButton({ side, value, selected, onChoose }: { side: Side; value: number; selected: boolean; onChoose: () => void }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onChoose} className={`w-[52px] rounded-lg px-1 py-2 text-sm font-bold tabular-nums ${selected ? "bg-accent text-accent-ink" : "bg-card-2 text-accent"}`}>
      <small className={`mb-0.5 block text-[10px] font-semibold ${selected ? "text-accent-ink" : "text-muted"}`}>{side}</small>
      {value.toFixed(2)}
    </button>
  );
}

function Switch({ label, narrow, onPrev, onNext, prevLabel, nextLabel }: { label: string; narrow?: boolean; onPrev: () => void; onNext: () => void; prevLabel: string; nextLabel: string }) {
  return (
    <div className="col-start-3 justify-self-end inline-flex items-center gap-0.5 rounded-full border border-line bg-card-2 p-0.5 text-ink">
      <button type="button" aria-label={prevLabel} onClick={onPrev} className="grid size-7 place-items-center rounded-full hover:bg-white/6">
        <Chevron dir="left" />
      </button>
      <span className={`px-1 text-center text-[13px] font-semibold ${narrow ? "max-w-[148px] truncate text-xs" : "min-w-[72px]"}`}>{label}</span>
      <button type="button" aria-label={nextLabel} onClick={onNext} className="grid size-7 place-items-center rounded-full hover:bg-white/6">
        <Chevron dir="right" />
      </button>
    </div>
  );
}

const medalSrc = {
  1: "/medals/gold.png",
  2: "/medals/silver.png",
  3: "/medals/bronze.png",
} as const;

function RankItem({ row }: { row: RankRow }) {
  const medal = medalSrc[row.place as 1 | 2 | 3];
  return (
    <li className="grid grid-cols-[22px_1fr_auto] items-center gap-2.5 border-t border-line py-2.5">
      <span className="grid h-[18px] place-items-center text-[13px] font-semibold text-muted tabular-nums">
        {medal ? <img src={medal} alt="" className="size-4 object-contain" /> : row.place}
        {medal ? <span className="sr-only">{row.place}</span> : null}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <svg viewBox="0 0 32 32" className="size-[26px] shrink-0" aria-hidden="true">
          <circle cx="16" cy="16" r="16" fill={row.color} />
          <text x="16" y="21" textAnchor="middle" fontSize="12" fontWeight="700" fill={row.ink} fontFamily="Outfit, sans-serif">{row.initials}</text>
        </svg>
        <b className="text-sm font-semibold">{row.name}</b>
        {row.you ? <span className="rounded-md bg-accent px-1.5 py-0.5 text-[11px] font-bold text-accent-ink">Você</span> : null}
      </div>
      <span className="inline-flex items-center gap-1 font-bold tabular-nums">
        <Coin />
        {row.points}
      </span>
    </li>
  );
}
