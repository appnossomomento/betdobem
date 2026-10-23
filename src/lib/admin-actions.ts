"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/admins";
import { readBoard, writeBoard, type SegmentFilter } from "@/lib/admin-store";
import { loadDirectory, matches } from "@/lib/admin-data";
import { weekKey } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { dispatchKind, dispatchText, type PushKind } from "@/lib/push";
import { nextRun } from "@/lib/push-when";
import type { PushMode, PushRules } from "@/lib/admin-store";

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

export async function sendPush(kind: PushKind) {
  const actor = await adminId();
  if (!actor || (kind !== "mercado_aberto" && kind !== "partidas_iniciando")) return { ok: false as const, sent: 0 };
  const result = await dispatchKind(kind, true);
  await audit(actor, "push", null, { kind, sent: result.sent });
  revalidatePath("/admin/push");
  revalidatePath("/admin/auditoria");
  return { ok: true as const, sent: result.sent, skipped: result.skipped };
}

export async function sendPushText(title: string, body: string) {
  const actor = await adminId();
  const text = cleanPush(title, body);
  if (!actor || !text) return { ok: false as const, sent: 0 };
  const stamp = Date.now();
  const result = await dispatchText(text.title, text.body, `texto-${stamp}`);
  await audit(actor, "push", null, { kind: text.title, sent: result.sent });
  revalidatePath("/admin/push");
  revalidatePath("/admin/auditoria");
  return { ok: true as const, sent: result.sent, skipped: result.skipped };
}

export async function savePushRules(rules: PushRules) {
  const actor = await adminId();
  if (!actor) return { ok: false as const };
  const board = await readBoard(true);
  board.pushRules = { morning: rules.morning === true, kickoff: rules.kickoff === true };
  await writeBoard(board);
  await audit(actor, "push_rule", null, { morning: board.pushRules.morning, kickoff: board.pushRules.kickoff });
  revalidatePath("/admin/push");
  return { ok: true as const };
}

export async function createPushPlan(input: { title: string; body: string; mode: PushMode; date: string | null; time: string | null; weekday: number | null }) {
  const actor = await adminId();
  const text = cleanPush(input.title, input.body);
  if (!actor || !text) return { ok: false as const, error: "texto" as const };
  const clock = input.time && /^\d{2}:\d{2}$/.test(input.time) ? input.time : null;
  const onceAt = input.mode === "once" && input.date && clock ? Date.parse(`${input.date}T${clock}:00-03:00`) : NaN;
  const plan = {
    id: id(),
    title: text.title,
    body: text.body,
    mode: input.mode,
    at: Number.isFinite(onceAt) ? new Date(onceAt).toISOString() : null,
    time: input.mode === "once" ? null : clock,
    weekday: input.mode === "weekly" ? input.weekday : null,
    enabled: true,
    nextAt: "",
    sentAt: null,
    createdAt: new Date().toISOString(),
  };
  if (plan.mode === "weekly" && (plan.weekday == null || plan.weekday < 0 || plan.weekday > 6)) return { ok: false as const, error: "dia" as const };
  if (plan.mode !== "once" && !plan.time) return { ok: false as const, error: "hora" as const };
  const nextAt = nextRun(plan);
  if (!nextAt || Date.parse(nextAt) <= Date.now()) return { ok: false as const, error: "hora" as const };
  plan.nextAt = nextAt;
  const board = await readBoard(true);
  board.pushPlans = [plan, ...board.pushPlans].slice(0, 40);
  await writeBoard(board);
  await audit(actor, "push_plan", null, { title: plan.title, mode: plan.mode });
  revalidatePath("/admin/push");
  return { ok: true as const };
}

export async function setPushPlanEnabled(planId: string, enabled: boolean) {
  const actor = await adminId();
  if (!actor) return { ok: false as const, error: "auth" as const };
  const board = await readBoard(true);
  const plan = board.pushPlans.find((item) => item.id === planId);
  if (!plan) return { ok: false as const, error: "auth" as const };
  if (enabled && plan.mode !== "once") {
    const following = nextRun(plan);
    if (!following) return { ok: false as const, error: "hora" as const };
    plan.nextAt = following;
  }
  if (enabled && plan.mode === "once" && Date.parse(plan.nextAt) <= Date.now()) return { ok: false as const, error: "passou" as const };
  plan.enabled = enabled;
  if (enabled) plan.sentAt = null;
  await writeBoard(board);
  revalidatePath("/admin/push");
  return { ok: true as const };
}

export async function removePushPlan(planId: string) {
  const actor = await adminId();
  if (!actor) return { ok: false as const };
  const board = await readBoard(true);
  board.pushPlans = board.pushPlans.filter((plan) => plan.id !== planId);
  await writeBoard(board);
  revalidatePath("/admin/push");
  return { ok: true as const };
}

function cleanPush(title: string, body: string) {
  const cleanTitle = title.trim().slice(0, 80);
  const cleanBody = body.trim().slice(0, 180);
  if (cleanTitle.length < 2 || cleanBody.length < 2) return null;
  return { title: cleanTitle, body: cleanBody };
}

async function audit(adminIdValue: string, action: string, targetUserId: string | null, payload: Record<string, string | number | boolean | null>) {
  const board = await readBoard(false);
  board.audits.unshift({ id: id(), adminId: adminIdValue, action, targetUserId, payload, createdAt: new Date().toISOString() });
  board.audits = board.audits.slice(0, 100);
  await writeBoard(board);
}
