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

export type Board = {
  segments: Segment[];
  polls: Poll[];
  notices: Notice[];
  audits: Audit[];
  banned: string[];
  vips: string[];
};

function blank(): Board {
  return { segments: [], polls: [], notices: [], audits: [], banned: [], vips: [] };
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

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { error } = await admin.storage.createBucket(bucket, { public: false });
  if (error && !/exist/i.test(error.message)) return;
}
