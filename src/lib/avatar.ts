"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const bucket = "avatars";

export async function saveAvatar(dataUrl: string) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const file = decodeImage(dataUrl);
  if (!file) return { ok: false as const, error: "Use JPG, PNG, WEBP ou GIF de até 2 MB." };
  const admin = createAdminClient();
  const url = await upload(admin, user.id, file);
  if (!url) return { ok: false as const, error: "Não foi possível salvar a foto." };
  const stored = `${url}?v=${Date.now()}`;
  const { error } = await admin.from("profiles").update({ avatar_url: stored }).eq("id", user.id);
  if (error) return { ok: false as const, error: "Não foi possível salvar a foto." };
  await supabase.auth.updateUser({ data: { avatar_url: stored } });
  revalidatePath("/perfil");
  revalidatePath("/");
  revalidatePath("/ranking");
  return { ok: true as const, url: stored };
}

export async function clearAvatar() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { ok: false as const, error: "Não foi possível remover a foto." };
  await supabase.auth.updateUser({ data: { avatar_url: "" } });
  revalidatePath("/perfil");
  revalidatePath("/");
  revalidatePath("/ranking");
  return { ok: true as const };
}

function decodeImage(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) return null;
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.length < 12 || bytes.length > 2 * 1024 * 1024) return null;
  const mime = sniff(bytes);
  if (!mime || mime !== match[1].toLowerCase()) return null;
  return { bytes, mime };
}

function sniff(bytes: Buffer) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes.subarray(0, 4).toString("ascii") === "GIF8") return "image/gif";
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return "";
}

async function upload(admin: ReturnType<typeof createAdminClient>, id: string, file: { bytes: Buffer; mime: string }) {
  const { error: bucketError } = await admin.storage.createBucket(bucket, { public: true });
  if (bucketError && !/exist/i.test(bucketError.message)) return null;
  const { error } = await admin.storage.from(bucket).upload(id, file.bytes, { upsert: true, contentType: file.mime });
  if (error) return null;
  return admin.storage.from(bucket).getPublicUrl(id).data.publicUrl;
}
