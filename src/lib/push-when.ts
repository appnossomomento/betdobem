import { ZONE } from "@/lib/economy";
import { saoPauloDay } from "@/lib/market";

const offset = "-03:00";
const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export type WhenPlan = {
  mode: "once" | "daily" | "weekly";
  at: string | null;
  time: string | null;
  weekday: number | null;
};

export function nextRun(plan: WhenPlan, after = Date.now()) {
  if (plan.mode === "once") return plan.at;
  const time = plan.time ?? "";
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const start = saoPauloDay(after);
  for (let step = 0; step < 8; step += 1) {
    const day = addDays(start, step);
    if (plan.mode === "weekly" && weekdayOf(day) !== plan.weekday) continue;
    const instant = Date.parse(`${day}T${time}:00${offset}`);
    if (instant > after) return new Date(instant).toISOString();
  }
  return null;
}

export function saoPauloStamp(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: ZONE }).format(time);
}

function addDays(day: string, days: number) {
  return saoPauloDay(Date.parse(`${day}T12:00:00${offset}`) + days * 86_400_000);
}

function weekdayOf(day: string) {
  const name = new Intl.DateTimeFormat("en-US", { timeZone: ZONE, weekday: "short" }).format(new Date(`${day}T12:00:00${offset}`));
  return weekdays.indexOf(name);
}
