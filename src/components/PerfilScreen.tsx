"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Account } from "@/lib/account";
import { saveProfile } from "@/lib/profile-save";
import { SIZES, TEAMS } from "@/lib/profile-fields";
import { createClient } from "@/lib/supabase/client";

const field = "mt-1 h-12 w-full rounded-xl bg-card-2 px-3 text-base text-ink outline-none";

export function PerfilScreen({ account }: { account: Account }) {
  const router = useRouter();
  const [nick, setNick] = useState(account.displayName);
  const [age, setAge] = useState(account.age ? String(account.age) : "");
  const [city, setCity] = useState(account.city);
  const [team, setTeam] = useState(account.favoriteTeam || TEAMS[0]);
  const [shirt, setShirt] = useState(account.shirtSize || "M");
  const [bottom, setBottom] = useState(account.bottomSize || "M");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await saveProfile({ nick, age: Number(age), city, favoriteTeam: team, shirtSize: shirt, bottomSize: bottom });
    setPending(false);
    setMessage(result.ok ? "Salvo." : result.error);
    if (result.ok) router.refresh();
  }

  async function leave() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[18px] border border-line bg-card p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-accent text-base font-bold text-accent-ink">{account.initials}</span>
        <div>
          <h1 className="text-xl">{account.displayName}</h1>
          <p className="text-sm text-muted">{account.email}</p>
        </div>
      </div>
      {account.admin ? <Link href="/admin" className="mt-4 inline-flex text-sm font-semibold text-accent">Painel</Link> : null}
      <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
        <Field label="Apelido"><input value={nick} maxLength={16} onChange={(event) => setNick(event.target.value)} className={field} /></Field>
        <Field label="Idade"><input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 3))} className={field} /></Field>
        <Field label="Cidade"><input value={city} maxLength={48} onChange={(event) => setCity(event.target.value)} className={field} /></Field>
        <Field label="Time que torce">
          <select value={team} onChange={(event) => setTeam(event.target.value)} className={field}>{TEAMS.map((item) => <option key={item}>{item}</option>)}</select>
        </Field>
        <Field label="Camisa"><select value={shirt} onChange={(event) => setShirt(event.target.value)} className={field}>{SIZES.map((item) => <option key={item}>{item}</option>)}</select></Field>
        <Field label="Short ou calça"><select value={bottom} onChange={(event) => setBottom(event.target.value)} className={field}>{SIZES.map((item) => <option key={item}>{item}</option>)}</select></Field>
        {message ? <p className="text-sm text-accent" role="status">{message}</p> : null}
        <button type="submit" disabled={pending} className="h-12 rounded-xl bg-accent text-base font-bold text-accent-ink disabled:opacity-60">Salvar</button>
      </form>
      <button type="button" onClick={leave} className="mt-4 h-12 w-full rounded-xl bg-[#c4292e] text-base font-bold text-white">Sair</button>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs text-muted">{label}{children}</label>;
}
