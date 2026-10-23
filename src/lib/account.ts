import "server-only";
import { connection } from "next/server";
import { isAdminEmail } from "@/lib/admins";
import { readBoard } from "@/lib/admin-store";
import { createClient } from "@/lib/supabase/server";

export type Account = {
  id: string;
  email: string;
  initials: string;
  displayName: string;
  balance: number;
  vip: boolean;
  admin: boolean;
  banned: boolean;
  age: number | null;
  city: string;
  favoriteTeam: string;
  shirtSize: string;
  bottomSize: string;
  unread: number;
};

export async function getAccount(): Promise<Account | null> {
  await connection();
  try {
    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;
    if (!user) return null;

    const meta = user.user_metadata ?? {};
    const full = await supabase
      .from("profiles")
      .select("initials, display_name, vip, shirt_size, avatar_url, nick, age, city, favorite_team, bottom_size, banned_at")
      .eq("id", user.id)
      .maybeSingle();
    const basic = full.error
      ? await supabase.from("profiles").select("initials, display_name, vip, shirt_size").eq("id", user.id).maybeSingle()
      : full;
    const profile = basic.data;
    const { data: rows } = await supabase.from("ledger").select("amount").eq("user_id", user.id);
    const balance = (rows ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
    const board = await readBoard();
    const banned = board.banned.includes(user.id) || Boolean(profile && "banned_at" in profile && profile.banned_at);
    const unread = board.notices.filter((notice) => notice.recipients.includes(user.id) && !notice.reads.some((item) => item.userId === user.id)).length;

    return {
      id: user.id,
      email: user.email ?? "",
      initials: text(profile?.initials, meta.initials) || "JB",
      displayName: text(profile?.display_name, meta.nick, meta.display_name) || "Jogador",
      balance,
      vip: Boolean(profile?.vip),
      admin: isAdminEmail(user.email),
      banned,
      age: numberOrNull(profile && "age" in profile ? profile.age : meta.age),
      city: text(profile && "city" in profile ? profile.city : undefined, meta.city),
      favoriteTeam: text(profile && "favorite_team" in profile ? profile.favorite_team : undefined, meta.favorite_team),
      shirtSize: text(profile?.shirt_size, meta.shirt_size),
      bottomSize: text(profile && "bottom_size" in profile ? profile.bottom_size : undefined, meta.bottom_size),
      unread,
    };
  } catch {
    return null;
  }
}

function text(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
}

function numberOrNull(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}
