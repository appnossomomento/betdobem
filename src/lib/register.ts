"use server";

import { initialsFrom, checkCpf, checkProfile, cpfDigits, type ProfileInput } from "@/lib/profile-fields";
import { isAdminEmail } from "@/lib/admins";
import { createAdminClient } from "@/lib/supabase/admin";

export async function registerAccount(input: ProfileInput & { email: string; password: string; cpf: string }) {
  const problem = checkProfile(input) || checkCpf(input.cpf);
  if (problem) return { ok: false as const, error: problem };
  const cpf = cpfDigits(input.cpf);
  const email = input.email.trim().toLowerCase();
  if (!email.includes("@") || input.password.length < 6) return { ok: false as const, error: "E-mail ou senha inválidos." };

  const nick = input.nick.trim();
  const admin = createAdminClient();
  const { data: taken } = await admin.from("profiles").select("id").ilike("display_name", nick).limit(1);
  if (taken && taken.length > 0) return { ok: false as const, error: "Esse apelido já existe." };

  const meta = {
    display_name: nick,
    nick,
    age: input.age,
    city: input.city.trim(),
    favorite_team: input.favoriteTeam,
    shirt_size: input.shirtSize,
    bottom_size: input.bottomSize,
    cpf,
  };
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: meta,
  });
  if (error || !data.user) {
    const message = error?.message ?? "";
    if (/already|registered|exists/i.test(message)) return { ok: false, error: "Esse e-mail já tem conta." };
    return { ok: false, error: "Não foi possível criar a conta." };
  }

  const initials = initialsFrom(nick);
  await admin.from("profiles").update({ display_name: nick, initials, shirt_size: input.shirtSize }).eq("id", data.user.id);
  await admin.from("profiles").update({
    nick,
    age: input.age,
    city: input.city.trim(),
    favorite_team: input.favoriteTeam,
    bottom_size: input.bottomSize,
    ...(isAdminEmail(email) ? { is_admin: true } : {}),
  }).eq("id", data.user.id);

  return { ok: true as const };
}
