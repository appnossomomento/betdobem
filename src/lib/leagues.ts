"use server";

import { revalidatePath } from "next/cache";
import { readBoard } from "@/lib/admin-store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bucket = "league-photos";

async function viewer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function createLeague(input: { name: string; prize: string; photo: string; duration: string; playerCap: number; visibility: "publica" | "privada" }) {
  const user = await viewer();
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const board = await readBoard();
  if (!board.vips.includes(user.id)) return { ok: false as const, error: "Criar liga é benefício VIP." };
  const admin = createAdminClient();
  if (await activeMemberships(admin, user.id) >= 3) return { ok: false as const, error: "Você já está em 3 ligas." };
  if (!input.photo.startsWith("data:image/")) return { ok: false as const, error: "Inclua uma foto da liga." };
  const name = input.name.trim();
  if (!name) return { ok: false as const, error: "Dê um nome para a liga." };

  const { data: created, error } = await admin.from("leagues").insert({
    host_id: user.id,
    name,
    duration: input.duration,
    player_cap: input.playerCap,
    visibility: input.visibility,
    outside_prize: input.prize.trim() || null,
  }).select("id").single();
  if (error || !created) return { ok: false as const, error: "Não foi possível criar a liga." };

  const photoUrl = await uploadPhoto(admin, created.id, input.photo);
  if (photoUrl) await admin.from("leagues").update({ photo_url: photoUrl }).eq("id", created.id);
  await admin.from("league_members").insert({ league_id: created.id, user_id: user.id });
  revalidatePath("/ranking");
  revalidatePath("/");
  return { ok: true as const, id: created.id };
}

export async function updateLeague(input: { id: string; name: string; prize: string; photo: string; duration: string; playerCap: number; visibility: "publica" | "privada" }) {
  const user = await viewer();
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const admin = createAdminClient();
  const { data: league } = await admin.from("leagues").select("host_id").eq("id", input.id).maybeSingle();
  if (league?.host_id !== user.id) return { ok: false as const, error: "Só o anfitrião administra." };
  const patch: Record<string, string | number | null> = {
    name: input.name.trim(),
    duration: input.duration,
    player_cap: input.playerCap,
    visibility: input.visibility,
    outside_prize: input.prize.trim() || null,
  };
  if (input.photo.startsWith("data:image/")) {
    const photoUrl = await uploadPhoto(admin, input.id, input.photo);
    if (photoUrl) patch.photo_url = photoUrl;
  }
  const { error } = await admin.from("leagues").update(patch).eq("id", input.id);
  if (error) return { ok: false as const, error: "Não foi possível salvar." };
  revalidatePath("/ranking");
  return { ok: true as const };
}

export async function leaveLeague(id: string) {
  const user = await viewer();
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const admin = createAdminClient();
  await admin.from("league_members").delete().eq("league_id", id).eq("user_id", user.id);
  revalidatePath("/ranking");
  revalidatePath("/");
  revalidatePath(`/liga/${id}`);
  return { ok: true as const };
}

export async function endLeague(id: string) {
  const user = await viewer();
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const admin = createAdminClient();
  const { data: league } = await admin.from("leagues").select("host_id").eq("id", id).maybeSingle();
  if (league?.host_id !== user.id) return { ok: false as const, error: "Só o anfitrião encerra." };
  await admin.from("leagues").update({ status: "ended" }).eq("id", id);
  revalidatePath("/ranking");
  return { ok: true as const };
}

export async function joinLeague(input: { id?: string; code?: string }) {
  const user = await viewer();
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const admin = createAdminClient();
  if (await activeMemberships(admin, user.id) >= 3) return { ok: false as const, error: "Você já está em 3 ligas." };
  const { data: leagues } = await admin.from("leagues").select("id, visibility, player_cap, status").eq("status", "active");
  const code = (input.code ?? "").replace(/[^a-z0-9]/gi, "").slice(0, 6).toLowerCase();
  const league = input.id
    ? (leagues ?? []).find((item) => item.id === input.id)
    : (leagues ?? []).find((item) => itemCode(item.id) === code);
  if (!league) return { ok: false as const, error: "Liga não encontrada." };
  if (!input.id && league.visibility === "privada" && itemCode(league.id) !== code) return { ok: false as const, error: "Código inválido." };
  const { count: members } = await admin.from("league_members").select("user_id", { count: "exact", head: true }).eq("league_id", league.id);
  if ((members ?? 0) >= league.player_cap) return { ok: false as const, error: "A liga está cheia." };
  const { error } = await admin.from("league_members").insert({ league_id: league.id, user_id: user.id });
  if (error && !/duplicate|unique/i.test(error.message)) return { ok: false as const, error: "Não foi possível entrar." };
  revalidatePath("/ranking");
  revalidatePath("/");
  revalidatePath(`/liga/${league.id}`);
  return { ok: true as const };
}

async function activeMemberships(admin: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: memberships } = await admin.from("league_members").select("league_id").eq("user_id", userId);
  const ids = (memberships ?? []).map((item) => item.league_id as string);
  if (ids.length === 0) return 0;
  const { count } = await admin.from("leagues").select("id", { count: "exact", head: true }).in("id", ids).eq("status", "active");
  return count ?? 0;
}

function itemCode(id: string) {
  return id.replace(/-/g, "").slice(0, 6).toLowerCase();
}

async function uploadPhoto(admin: ReturnType<typeof createAdminClient>, id: string, dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length > 2 * 1024 * 1024) return null;
  const { error: bucketError } = await admin.storage.createBucket(bucket, { public: true });
  if (bucketError && !/exist/i.test(bucketError.message)) return null;
  const path = `${id}`;
  const { error } = await admin.storage.from(bucket).upload(path, bytes, { upsert: true, contentType: match[1] });
  if (error) return null;
  return admin.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
