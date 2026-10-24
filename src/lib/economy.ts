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

/** O que passou das 50 moedas iniciais (fechamento de semana / ranking legado). */
export function profitOf(capital: number) {
  return Math.round((capital - MARCO_ZERO_COINS) * 100) / 100;
}

type ProfitBet = { stake: number; potential_return: number; status: string; week_key?: string | null; placed_at?: string | null };

/** Lucro de uma aposta encerrada. Aberta e anulada não mexem. Perdida deduz a stake. */
export function betProfit(bet: ProfitBet) {
  if (bet.status === "won") return Math.round((Number(bet.potential_return) - Number(bet.stake)) * 100) / 100;
  if (bet.status === "lost") return Math.round(-Number(bet.stake) * 100) / 100;
  return 0;
}

export function settledProfit(bets: ProfitBet[]) {
  return Math.round(bets.reduce((sum, bet) => sum + betProfit(bet), 0) * 100) / 100;
}

/** Lucro da semana: parte de zero; apostas abertas não entram. */
export function weekProfit(bets: ProfitBet[], now = new Date()) {
  const week = weekKey(now);
  return settledProfit(bets.filter((bet) => (bet.week_key || weekKey(new Date(bet.placed_at || now))) === week));
}

/** Lucro do mês: parte de zero; só apostas já liquidadas do mês. */
export function monthProfit(bets: ProfitBet[], now = new Date()) {
  const month = monthKey(now);
  return settledProfit(bets.filter((bet) => monthKey(new Date(bet.placed_at || now)) === month));
}

/** Lucro acumulado: semanas fechadas em profiles.saldo_total + lucro liquidado da semana aberta. */
export function totalSaldo(closed: number, openWeekProfit: number) {
  return Math.round((closed + openWeekProfit) * 100) / 100;
}
