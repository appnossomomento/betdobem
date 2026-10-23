"use client";

import { useState } from "react";
import { Chevron } from "./Icons";

export type TeamSlice = { team: string; fans: number; color: string };

const pageSize = 10;

export function TeamsBoard({ rows }: { rows: TeamSlice[] }) {
  const [page, setPage] = useState(0);
  const total = rows.reduce((sum, row) => sum + row.fans, 0);
  const slices = rows.filter((row) => row.fans > 0);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = rows.slice(safePage * pageSize, safePage * pageSize + pageSize);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl">Times</h1>
      <section className="rounded-2xl border border-line bg-card p-4">
        {slices.length === 0 ? <p className="text-sm text-muted">Nenhum time ainda.</p> : (
          <div className="flex flex-col items-center gap-5 min-[880px]:flex-row min-[880px]:items-center min-[880px]:gap-8">
            <div className="relative size-52 shrink-0">
              <div className="size-full rounded-full" style={{ background: pieGradient(slices, total) }} />
              <div className="absolute inset-[28%] rounded-full bg-card" />
            </div>
            <ul className="grid w-full gap-1.5">
              {slices.map((row) => (
                <li key={row.team} className="flex items-center gap-2 text-sm">
                  <span className="size-2.5 shrink-0 rounded-full border border-white/30" style={{ background: row.color }} />
                  <span className="min-w-0 flex-1 truncate">{row.team}</span>
                  <span className="tabular-nums text-muted">{share(row.fans, total)}%</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      <section className="rounded-2xl border border-line bg-card">
        <ul>
          {visible.map((row) => (
            <li key={row.team} className="flex items-center gap-3 border-t border-line px-4 py-3 first:border-t-0">
              <span className="size-2.5 shrink-0 rounded-full border border-white/30" style={{ background: row.color }} />
              <b className="min-w-0 flex-1 truncate text-sm font-semibold">{row.team}</b>
              <span className="text-xs text-muted tabular-nums">{row.fans} · {share(row.fans, total)}%</span>
            </li>
          ))}
        </ul>
        <div className="flex items-center justify-end gap-2 border-t border-line px-3 py-2">
          <button type="button" aria-label="Página anterior" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="grid size-8 place-items-center rounded-lg bg-card-2 text-ink disabled:opacity-30">
            <Chevron dir="left" />
          </button>
          <span className="min-w-10 text-center text-xs tabular-nums text-muted">{safePage + 1}/{pages}</span>
          <button type="button" aria-label="Próxima página" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} className="grid size-8 place-items-center rounded-lg bg-card-2 text-ink disabled:opacity-30">
            <Chevron dir="right" />
          </button>
        </div>
      </section>
    </div>
  );
}

function share(fans: number, total: number) {
  if (!total) return 0;
  return Math.round((fans / total) * 100);
}

function pieGradient(slices: TeamSlice[], total: number) {
  let cursor = 0;
  const parts: string[] = [];
  const gap = slices.length > 1 ? 1.1 : 0;
  for (const slice of slices) {
    const span = (slice.fans / total) * 100;
    const inset = span > gap * 2 ? gap / 2 : 0;
    parts.push(`#1a1a1a ${cursor}% ${cursor + inset}%`);
    parts.push(`${slice.color} ${cursor + inset}% ${cursor + span - inset}%`);
    parts.push(`#1a1a1a ${cursor + span - inset}% ${cursor + span}%`);
    cursor += span;
  }
  return `conic-gradient(${parts.join(",")})`;
}
