import { ZONE } from "@/lib/economy";

const leadMs = 60_000;

/** Até o apito final (com teto de 8h) o placar continua sendo buscado. */
const liveWindowMs = 8 * 60 * 60 * 1000;

/**
 * Se a ESPN fica presa em "ao vivo" (chuva, feed travado), após ~2h do kickoff
 * tratamos o placar atual como final para liquidar bilhetes.
 */
export const stuckLiveMs = 120 * 60 * 1000;

export function forceFinished(kickoff: string, live: boolean, finished: boolean, now = Date.now()) {
  if (finished || !live) return false;
  const start = Date.parse(kickoff);
  if (!Number.isFinite(start)) return false;
  return now - start >= stuckLiveMs;
}

export function followLive(kickoff: string, finished: boolean, live: boolean, now = Date.now()) {
  if (finished) return false;
  if (forceFinished(kickoff, live, finished, now)) return false;
  if (live) return true;
  const start = Date.parse(kickoff);
  if (!Number.isFinite(start)) return false;
  return start - 2 * 60_000 <= now && now - start < liveWindowMs;
}

export function marketOpen(kickoff: string, now = Date.now()) {
  const start = Date.parse(kickoff);
  if (!Number.isFinite(start)) return false;
  return now < start - leadMs;
}

export function kickoffDay(kickoff: string, now = Date.now()) {
  const start = Date.parse(kickoff);
  if (!Number.isFinite(start)) return "invalid" as const;
  const game = saoPauloDay(start);
  const today = saoPauloDay(now);
  if (game === today) return "today" as const;
  return game > today ? "future" as const : "past" as const;
}

export function saoPauloDay(time: number) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONE }).format(time);
}

export function saoPauloHour(time = Date.now()) {
  const hour = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, hour: "2-digit", hourCycle: "h23" }).formatToParts(time).find((part) => part.type === "hour")?.value;
  return Number(hour ?? "0");
}

const weekdayName: Record<string, string> = {
  Sun: "domingo",
  Mon: "segunda",
  Tue: "terça",
  Wed: "quarta",
  Thu: "quinta",
  Fri: "sexta",
  Sat: "sábado",
};

export function marketOpenLabel(kickoff: string) {
  const start = Date.parse(kickoff);
  if (!Number.isFinite(start)) return "Mercado aberto";
  const key = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short" }).format(start);
  const name = weekdayName[key];
  return name ? `Mercado aberto ${name}` : "Mercado aberto";
}
