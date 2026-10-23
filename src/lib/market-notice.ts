import "server-only";
import { getRound } from "@/lib/round";
import { kickoffDay, saoPauloDay, saoPauloHour } from "@/lib/market";
import { readBoard, writeBoard, type Notice } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function ensureMarketNotice() {
  const now = Date.now();
  if (saoPauloHour(now) < 8) return;
  const day = saoPauloDay(now);
  const board = await readBoard();
  const id = `mercado-${day}`;
  const existing = board.notices.find((notice) => notice.id === id);
  const admin = createAdminClient();
  const { data: profiles } = await admin.from("profiles").select("id");
  const ids = (profiles ?? []).map((profile) => profile.id);
  if (ids.length === 0) return;
  if (existing) {
    const missing = ids.filter((userId) => !existing.recipients.includes(userId));
    if (missing.length === 0) return;
    existing.recipients.push(...missing);
    await writeBoard(board);
    return;
  }
  const round = await getRound();
  const latest = await readBoard(true);
  const already = latest.notices.find((notice) => notice.id === id);
  if (already) {
    const missing = ids.filter((userId) => !already.recipients.includes(userId));
    if (missing.length === 0) return;
    already.recipients.push(...missing);
    await writeBoard(latest);
    return;
  }
  const count = round.games.filter((game) => !game.finished && kickoffDay(game.kickoff, now) === "today").length;
  if (count === 0) return;
  const notice: Notice = {
    id,
    title: "Mercado aberto",
    body: count === 1 ? "Hoje tem 1 jogo para apostar." : `Hoje tem ${count} jogos para apostar.`,
    segmentId: null,
    createdAt: morningIso(day),
    recipients: ids,
    reads: [],
  };
  latest.notices.unshift(notice);
  await writeBoard(latest);
}

function morningIso(day: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date, 11, 0, 0)).toISOString();
}
