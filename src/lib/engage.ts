"use server";

import { revalidatePath } from "next/cache";
import { loadDirectory, matches } from "@/lib/admin-data";
import { readBoard, writeBoard } from "@/lib/admin-store";
import { createClient } from "@/lib/supabase/server";

async function userId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function votePoll(pollId: string, optionId: string) {
  const id = await userId();
  if (!id) return { ok: false as const };
  const board = await readBoard(true);
  const poll = board.polls.find((item) => item.id === pollId);
  if (!poll || poll.closed || Date.parse(poll.endsAt) < Date.now()) return { ok: false as const };
  if (!poll.options.some((option) => option.id === optionId)) return { ok: false as const };
  if (poll.segmentId) {
    const person = (await loadDirectory()).find((item) => item.id === id);
    const segment = board.segments.find((item) => item.id === poll.segmentId);
    if (!person || !segment || !matches(person, segment.filter)) return { ok: false as const };
  }
  if (poll.votes.some((vote) => vote.userId === id)) return { ok: true as const };
  poll.votes.push({ userId: id, optionId });
  await writeBoard(board);
  revalidatePath("/");
  return { ok: true as const };
}

export async function markNotice(noticeId: string) {
  const id = await userId();
  if (!id) return;
  const board = await readBoard(true);
  const notice = board.notices.find((item) => item.id === noticeId);
  if (!notice || !notice.recipients.includes(id) || notice.reads.some((item) => item.userId === id)) return;
  notice.reads.push({ userId: id, readAt: new Date().toISOString() });
  await writeBoard(board);
  revalidatePath("/avisos");
  revalidatePath("/");
}
