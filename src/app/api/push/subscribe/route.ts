import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim() ?? "";
  if (token.length < 20) return NextResponse.json({ ok: false }, { status: 400 });
  const admin = createAdminClient();
  const now = new Date().toISOString();
  const { error } = await admin.from("push_subscriptions").upsert(
    { user_id: user.id, token, user_agent: (request.headers.get("user-agent") ?? "").slice(0, 240), updated_at: now },
    { onConflict: "token" },
  );
  if (error) return NextResponse.json({ ok: false }, { status: 503 });
  return NextResponse.json({ ok: true });
}
