"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/admins";
import { readBoard, writeBoard, type SegmentFilter } from "@/lib/admin-store";
import { loadDirectory, matches } from "@/lib/admin-data";
import { weekKey } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function adminId() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!isAdminEmail(data.user?.email)) return null;
  return data.user?.id ?? null;
}

function id() {
  return crypto.randomUUID();
}

export async function setVip(userId: string, vip: boolean) {
  const actor = await adminId();
  if (!actor) return { ok: false as const };
  const board = await readBoard(true);
  board.vips = vip ? [...new Set([...board.vips, userId])] : board.vips.filter((id) => id !== userId);
  await writeBoard(board);
  const admin = createAdminClient();
  await admin.from("profiles").update({ vip }).eq("id", userId);
  await audit(actor, vip ? "vip_on" : "vip_off", userId, {});
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function adjustBalance(userId: string, amount: number, reason: string) {
  const actor = await adminId();
  if (!actor || !reason.trim() || !Number.isFinite(amount) || amount === 0) return { ok: false as const };
  const admin = createAdminClient();
  await admin.from("ledger").insert({ user_id: userId, kind: "ajuste", amount, week_key: weekKey(), ref_type: "admin" });
  await audit(actor, "ajuste", userId, { amount, reason: reason.trim() });
  revalidatePath("/admin");
  revalidatePath("/carteira");
  return { ok: true as const };
}

export async function setBanned(userId: string, banned: boolean) {
  const actor = await adminId();
  if (!actor) return { ok: false as const };
  const board = await readBoard(true);
  board.banned = banned ? [...new Set([...board.banned, userId])] : board.banned.filter((item) => item !== userId);
  await writeBoard(board);
  await audit(actor, banned ? "ban" : "unban", userId, {});
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function saveSegment(name: string, filter: SegmentFilter) {
  const actor = await adminId();
  if (!actor || !name.trim()) return { ok: false as const, count: 0 };
  const people = await loadDirectory();
  const count = people.filter((person) => matches(person, filter)).length;
  const board = await readBoard(true);
  board.segments.unshift({ id: id(), name: name.trim(), filter, createdAt: new Date().toISOString() });
  await writeBoard(board);
  revalidatePath("/admin/segmentos");
  return { ok: true as const, count };
}

export async function previewSegment(filter: SegmentFilter) {
  const actor = await adminId();
  if (!actor) return 0;
  const people = await loadDirectory();
  return people.filter((person) => matches(person, filter)).length;
}

export async function createPoll(input: { question: string; options: string[]; segmentId: string | null; endsAt: string }) {
  const actor = await adminId();
  if (!actor || input.options.filter(Boolean).length < 2) return { ok: false as const };
  const board = await readBoard(true);
  board.polls.unshift({
    id: id(),
    question: input.question.trim(),
    options: input.options.filter(Boolean).slice(0, 6).map((label) => ({ id: id(), label: label.trim() })),
    segmentId: input.segmentId,
    endsAt: input.endsAt,
    closed: false,
    votes: [],
    createdAt: new Date().toISOString(),
  });
  await writeBoard(board);
  await audit(actor, "poll", null, { question: input.question.trim() });
  revalidatePath("/admin/enquetes");
  return { ok: true as const };
}

export async function closePoll(pollId: string) {
  const actor = await adminId();
  if (!actor) return;
  const board = await readBoard(true);
  const poll = board.polls.find((item) => item.id === pollId);
  if (poll) poll.closed = true;
  await writeBoard(board);
  revalidatePath("/admin/enquetes");
}

export async function sendNotice(input: { title: string; body: string; segmentId: string | null }) {
  const actor = await adminId();
  if (!actor || !input.title.trim() || !input.body.trim()) return { ok: false as const, sent: 0 };
  const people = await loadDirectory();
  const board = await readBoard(true);
  const segment = input.segmentId ? board.segments.find((item) => item.id === input.segmentId) : null;
  const recipients = people.filter((person) => !person.banned && (!segment || matches(person, segment.filter))).map((person) => person.id);
  board.notices.unshift({
    id: id(),
    title: input.title.trim(),
    body: input.body.trim(),
    segmentId: input.segmentId,
    createdAt: new Date().toISOString(),
    recipients,
    reads: [],
  });
  await writeBoard(board);
  await audit(actor, "notice", null, { title: input.title.trim(), sent: recipients.length });
  revalidatePath("/admin/avisos");
  return { ok: true as const, sent: recipients.length };
}

async function audit(adminIdValue: string, action: string, targetUserId: string | null, payload: Record<string, string | number | boolean | null>) {
  const board = await readBoard(false);
  board.audits.unshift({ id: id(), adminId: adminIdValue, action, targetUserId, payload, createdAt: new Date().toISOString() });
  board.audits = board.audits.slice(0, 100);
  await writeBoard(board);
}
