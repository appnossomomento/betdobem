/** Banca inicial e valor do reset de terça-feira, 01h00. */
export const MARCO_ZERO_COINS = 50;

export const ZONE = "America/Sao_Paulo";

/**
 * Semana BETdoBEM — NÃO usar semana ISO (segunda→domingo).
 * Começa toda terça-feira às 01:00 em São Paulo e vai até a próxima terça 01:00
 * (mesmo instante do cron `/api/reset`).
 */
export const WEEK_START_WEEKDAY = "Tue" as const;
export const WEEK_RESET_HOUR_SP = 1;

const sinceTuesday: Record<string, number> = { Tue: 0, Wed: 1, Thu: 2, Fri: 3, Sat: 4, Sun: 5, Mon: 6 };

/**
 * Chave da semana de ranking/apostas: `T2026-10-27` = terça SP que abriu a semana.
 * Prefixo `T` distingue do legado ISO `W44-2026`.
 */
export function weekKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: ZONE,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const weekday = parts.find((part) => part.type === "weekday")?.value ?? WEEK_START_WEEKDAY;
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const back = weekday === WEEK_START_WEEKDAY && hour < WEEK_RESET_HOUR_SP ? 7 : sinceTuesday[weekday] ?? 0;
  const start = new Date(Date.UTC(year, month - 1, day - back));
  const y = start.getUTCFullYear();
  const m = String(start.getUTCMonth() + 1).padStart(2, "0");
  const d = String(start.getUTCDate()).padStart(2, "0");
  return `T${y}-${m}-${d}`;
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

function betWeekKey(bet: ProfitBet, now: Date) {
  // Só confia em week_key já no formato T…; legado W##-YYYY recalcula pelo placed_at.
  if (bet.week_key?.startsWith("T")) return bet.week_key;
  return weekKey(new Date(bet.placed_at || now));
}

/** Lucro da semana BETdoBEM (terça 01h→terça 01h); apostas abertas não entram. */
export function weekProfit(bets: ProfitBet[], now = new Date()) {
  const week = weekKey(now);
  return settledProfit(bets.filter((bet) => betWeekKey(bet, now) === week));
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
