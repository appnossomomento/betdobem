/** Banca inicial e valor do reset de terça-feira, 01h00. */
export const MARCO_ZERO_COINS = 50;

export const ZONE = "America/Sao_Paulo";

/** Mesma chave do SQL: `to_char(..., '"W"IW-IYYY')` → `W43-2026`. Semana ISO do calendário de São Paulo. */
export function weekKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const utc = new Date(Date.UTC(year, month - 1, day));
  const dayNum = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - dayNum);
  const isoYear = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `W${String(week).padStart(2, "0")}-${isoYear}`;
}

export function monthKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit" }).format(date).slice(0, 7);
}

/** O que passou das 50 moedas iniciais. */
export function profitOf(capital: number) {
  return Math.round((capital - MARCO_ZERO_COINS) * 100) / 100;
}

/** Lucro das semanas já fechadas neste mês, mais o lucro da semana aberta. */
export function monthProfit(balance: number, entries: { kind: string; amount: number; created_at: string }[], now = new Date()) {
  const month = monthKey(now);
  const closed = entries.reduce((sum, entry) => {
    if (entry.kind !== "reset" || monthKey(new Date(entry.created_at)) !== month) return sum;
    return sum + profitOf(-Number(entry.amount));
  }, 0);
  return Math.round((closed + profitOf(balance)) * 100) / 100;
}

/** Lucro acumulado: semanas já guardadas em profiles.saldo_total + semana aberta. */
export function totalSaldo(closed: number, balance: number) {
  return Math.round((closed + profitOf(balance)) * 100) / 100;
}
