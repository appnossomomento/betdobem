import "server-only";
import { readBoard, writeBoard } from "@/lib/admin-store";
import { kickoffDay, marketOpen, saoPauloDay, saoPauloHour } from "@/lib/market";
import { dispatchKind, dispatchText, firebaseAccount } from "@/lib/push";
import { nextRun } from "@/lib/push-when";
import { getRound } from "@/lib/round";

const minute = 60_000;

export async function sendMorningIfDue(now = Date.now()) {
  if (saoPauloHour(now) !== 8) return { ok: true as const, skipped: "cedo" as const, sent: 0 };
  const round = await getRound();
  const today = round.games.some((game) => !game.finished && kickoffDay(game.kickoff, now) === "today");
  if (!today) return { ok: true as const, skipped: "dia" as const, sent: 0 };
  return dispatchKind("mercado_aberto");
}

export async function sendKickoffIfDue(now = Date.now()) {
  const round = await getRound();
  const first = round.games
    .filter((game) => !game.finished && kickoffDay(game.kickoff, now) === "today")
    .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0];
  if (!first) return { ok: true as const, skipped: "dia" as const, sent: 0 };
  const kick = Date.parse(first.kickoff);
  const closeAt = kick - minute;
  const sendAt = closeAt - 15 * minute;
  if (now < sendAt || now >= closeAt || !marketOpen(first.kickoff, now)) return { ok: true as const, skipped: "janela" as const, sent: 0 };
  return dispatchKind("partidas_iniciando");
}

export async function runPushClock(now = Date.now()) {
  if (!firebaseAccount()) return { ok: true as const, skipped: "firebase" as const, plans: 0 };
  const board = await readBoard(true);
  const day = saoPauloDay(now);
  let plans = 0;
  let changed = false;
  for (const plan of board.pushPlans) {
    const due = Date.parse(plan.nextAt);
    if (!plan.enabled || !Number.isFinite(due) || due > now) continue;
    const deliveryKind = plan.mode === "once" ? `plan-${plan.id}` : `plan-${plan.id}-${day}`;
    await dispatchText(plan.title, plan.body, deliveryKind);
    if (plan.mode === "once") {
      plan.enabled = false;
      plan.sentAt = new Date(now).toISOString();
    } else {
      const following = nextRun(plan, now);
      if (following) plan.nextAt = following;
      else plan.enabled = false;
    }
    plans += 1;
    changed = true;
  }
  if (changed) await writeBoard(board);
  if (board.pushRules.morning) await sendMorningIfDue(now);
  if (board.pushRules.kickoff) await sendKickoffIfDue(now);
  return { ok: true as const, skipped: null, plans };
}
