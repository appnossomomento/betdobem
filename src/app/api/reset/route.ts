import { NextResponse } from "next/server";
import { MARCO_ZERO_COINS, monthKey, weekKey } from "@/lib/economy";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const admin = createAdminClient();
  const week = weekKey();
  const month = monthKey();
  const now = new Date();
  const { data: already } = await admin.from("weeks").select("week_key").eq("week_key", week).maybeSingle();
  if (already) return NextResponse.json({ ok: true, reset: 0, week, skipped: true });
  const { data: profiles } = await admin.from("profiles").select("id");
  const { data: ledger } = await admin.from("ledger").select("user_id, amount");
  const balances = new Map<string, number>();
  for (const row of ledger ?? []) balances.set(row.user_id, (balances.get(row.user_id) ?? 0) + Number(row.amount));
  await admin.from("weeks").upsert({ week_key: week, starts_at: now.toISOString(), ends_at: now.toISOString(), reset_at: now.toISOString() });
  let reset = 0;
  for (const profile of profiles ?? []) {
    const balance = Math.round((balances.get(profile.id) ?? 0) * 100) / 100;
    await admin.from("week_capitals").upsert({ user_id: profile.id, week_key: week, capital: balance });
    const { data: monthRow } = await admin.from("month_capitals").select("capital").eq("user_id", profile.id).eq("month_key", month).maybeSingle();
    const next = Math.round(((monthRow ? Number(monthRow.capital) : 0) + balance) * 100) / 100;
    await admin.from("month_capitals").upsert({ user_id: profile.id, month_key: month, capital: next });
    if (balance !== 0) await admin.from("ledger").insert({ user_id: profile.id, kind: "reset", amount: -balance, week_key: week });
    await admin.from("ledger").insert({ user_id: profile.id, kind: "marco_zero", amount: MARCO_ZERO_COINS, week_key: week });
    const { data: memberships } = await admin.from("league_members").select("league_id").eq("user_id", profile.id);
    for (const membership of memberships ?? []) {
      await admin.from("league_capital_events").insert({ league_id: membership.league_id, user_id: profile.id, coins: balance });
    }
    reset += 1;
  }
  return NextResponse.json({ ok: true, reset, week });
}
