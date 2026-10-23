import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ ok: false }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { token?: string } | null;
  const token = body?.token?.trim() ?? "";
  if (token.length < 20) return NextResponse.json({ ok: true });
  const admin = createAdminClient();
  await admin.from("push_subscriptions").delete().eq("user_id", data.user.id).eq("token", token);
  return NextResponse.json({ ok: true });
}
