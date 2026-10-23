/** Valor provisório até o fundador fechar o marco zero. UI histórica: 186. */
export const MARCO_ZERO_COINS = 186;

export const ZONE = "America/Sao_Paulo";

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
  const oneJan = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil((((utc.getTime() - oneJan.getTime()) / 86400000) + oneJan.getUTCDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export function monthKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE, year: "numeric", month: "2-digit" }).format(date).slice(0, 7);
}
