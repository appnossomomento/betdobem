import { NextResponse } from "next/server";
import { activePoll } from "@/lib/poll";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ poll: null });
  return NextResponse.json({ poll: await activePoll(data.user.id) });
}
