import { NextResponse } from "next/server";
import { firebasePublic } from "@/lib/push";

export async function GET() {
  const config = firebasePublic();
  if (!config) return NextResponse.json({ ok: false });
  return NextResponse.json({ ok: true, ...config });
}
