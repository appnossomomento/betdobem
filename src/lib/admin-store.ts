import "server-only";
import { connection } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const bucket = "admin-data";

export type SegmentFilter = {
  team?: string;
  city?: string;
  ageMin?: number;
  ageMax?: number;
  vip?: boolean;
  banned?: boolean;
  betWithinDays?: number;
  neverBet?: boolean;
  balanceMin?: number;
  balanceMax?: number;
  inLeague?: boolean;
};

export type Segment = { id: string; name: string; filter: SegmentFilter; createdAt: string };
export type PollOption = { id: string; label: string };
export type Poll = {
  id: string;
  question: string;
  options: PollOption[];
  segmentId: string | null;
  endsAt: string;
  closed: boolean;
  votes: { userId: string; optionId: string }[];
  createdAt: string;
};
export type Notice = {
  id: string;
  title: string;
  body: string;
  segmentId: string | null;
  createdAt: string;
  recipients: string[];
  reads: { userId: string; readAt: string }[];
};
export type Audit = {
  id: string;
  adminId: string;
  action: string;
  targetUserId: string | null;
  payload: Record<string, string | number | boolean | null>;
  createdAt: string;
};

export type PushMode = "once" | "daily" | "weekly";

export type PushPlan = {
  id: string;
  title: string;
  body: string;
  mode: PushMode;
  at: string | null;
  time: string | null;
  weekday: number | null;
  enabled: boolean;
  nextAt: string;
  sentAt: string | null;
  createdAt: string;
};

export type PushRules = { morning: boolean; kickoff: boolean };

export type Board = {
  segments: Segment[];
  polls: Poll[];
  notices: Notice[];
  audits: Audit[];
  banned: string[];
  vips: string[];
  pushPlans: PushPlan[];
  pushRules: PushRules;
};

function blank(): Board {
  return { segments: [], polls: [], notices: [], audits: [], banned: [], vips: [], pushPlans: [], pushRules: { morning: false, kickoff: false } };
}
let cache: { at: number; board: Board } | null = null;

export async function readBoard(force = false): Promise<Board> {
  await connection();
  if (!force && cache && Date.now() - cache.at < 8000) return cache.board;
  try {
    const admin = createAdminClient();
    await ensureBucket(admin);
    const { data, error } = await admin.storage.from(bucket).download("board.json");
    if (error || !data) {
      const board = structuredClone(cache?.board ?? blank());
      cache = { at: Date.now(), board };
      return board;
    }
    const parsed = JSON.parse(await data.text()) as Partial<Board>;
    const board: Board = {
      ...blank(),
      ...parsed,
      banned: Array.isArray(parsed.banned) ? parsed.banned : [],
      vips: Array.isArray(parsed.vips) ? parsed.vips : [],
      pushPlans: Array.isArray(parsed.pushPlans) ? parsed.pushPlans.filter(planOk) : [],
      pushRules: {
        morning: parsed.pushRules?.morning === true,
        kickoff: parsed.pushRules?.kickoff === true,
      },
    };
    cache = { at: Date.now(), board };
    return board;
  } catch {
    return structuredClone(cache?.board ?? blank());
  }
}

export async function writeBoard(board: Board) {
  const admin = createAdminClient();
  await ensureBucket(admin);
  const body = JSON.stringify(board);
  const { error } = await admin.storage.from(bucket).upload("board.json", new Blob([body], { type: "application/json" }), {
    upsert: true,
    contentType: "application/json",
  });
  if (error) throw new Error(error.message);
  cache = { at: Date.now(), board };
}

function planOk(plan: PushPlan) {
  return Boolean(plan && plan.id && plan.title && plan.body && plan.nextAt && (plan.mode === "once" || plan.mode === "daily" || plan.mode === "weekly"));
}

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.storage.createBucket(bucket, { public: false });
  if (error && !/exist/i.test(error.message)) return;
}
