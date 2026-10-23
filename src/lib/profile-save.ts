"use server";

import { revalidatePath } from "next/cache";
import { initialsFrom, checkProfile, type ProfileInput } from "@/lib/profile-fields";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function saveProfile(input: ProfileInput) {
  const problem = checkProfile(input);
  if (problem) return { ok: false as const, error: problem };
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return { ok: false as const, error: "Entre na conta." };
  const nick = input.nick.trim();
  const admin = createAdminClient();
  const { data: taken } = await admin.from("profiles").select("id").ilike("display_name", nick).neq("id", user.id).limit(1);
  if (taken && taken.length > 0) return { ok: false as const, error: "Esse apelido já existe." };
  const meta = {
    display_name: nick,
    nick,
    age: input.age,
    city: input.city.trim(),
    favorite_team: input.favoriteTeam,
    shirt_size: input.shirtSize,
    bottom_size: input.bottomSize,
  };
  const { error } = await supabase.auth.updateUser({ data: meta });
  if (error) return { ok: false as const, error: "Não foi possível salvar." };
  await admin.from("profiles").update({ display_name: nick, initials: initialsFrom(nick), shirt_size: input.shirtSize }).eq("id", user.id);
  await admin.from("profiles").update({ nick, age: input.age, city: input.city.trim(), favorite_team: input.favoriteTeam, bottom_size: input.bottomSize }).eq("id", user.id);
  revalidatePath("/perfil");
  revalidatePath("/ranking");
  return { ok: true as const };
}
