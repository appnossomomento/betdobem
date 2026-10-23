"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerAccount } from "@/lib/register";
import { SIZES, TEAMS, checkProfile } from "@/lib/profile-fields";
import { readSlip } from "@/lib/slip-store";
import { createClient } from "@/lib/supabase/client";

const field = "mt-1 h-12 w-full rounded-xl bg-card-2 px-3 text-base text-ink outline-none";

export function LoginScreen({ banned = false }: { banned?: boolean }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [nick, setNick] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [team, setTeam] = useState<(typeof TEAMS)[number]>(TEAMS[0]);
  const [shirt, setShirt] = useState<(typeof SIZES)[number]>("M");
  const [bottom, setBottom] = useState<(typeof SIZES)[number]>("M");

  function afterAuth() {
    const slip = readSlip();
    router.push(slip && slip.order.length > 0 ? "/jogos?bilhete=1" : "/");
    router.refresh();
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setPending(true);
    const supabase = createClient();
    if (resetting) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/callback` });
      setPending(false);
      setMessage(error ? "Não foi possível enviar o link." : "Link enviado para o e-mail.");
      return;
    }
    if (creating) {
      const input = { nick, age: Number(age), city, favoriteTeam: team, shirtSize: shirt, bottomSize: bottom };
      const problem = checkProfile(input);
      if (problem) {
        setPending(false);
        setMessage(problem);
        return;
      }
      const created = await registerAccount({ ...input, email, password });
      if (!created.ok) {
        setPending(false);
        setMessage(created.error);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setPending(false);
      if (error) {
        setMessage("Conta criada. Entre com o e-mail e a senha.");
        setCreating(false);
        return;
      }
      afterAuth();
      return;
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPending(false);
    if (error) {
      setMessage("E-mail ou senha não conferem.");
      return;
    }
    afterAuth();
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-bg px-4 py-8">
      <section className="w-full max-w-md rounded-[18px] border border-line bg-card p-5 shadow-[0_10px_28px_rgba(0,0,0,0.28)]">
        <img src="/logo-bet-do-bem/LogoPrincipal-completo.png" alt="BETdoBEM" className="mx-auto h-14 w-auto" />
        {banned ? <p className="mt-4 text-center text-sm font-semibold text-[#c4292e]">Conta suspensa.</p> : null}
        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          {creating ? (
            <>
              <Field label="Apelido"><input value={nick} maxLength={16} onChange={(event) => setNick(event.target.value)} required className={field} /></Field>
              <Field label="E-mail"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={field} /></Field>
              <Field label="Senha"><input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className={field} /></Field>
              <Field label="Idade"><input inputMode="numeric" value={age} onChange={(event) => setAge(event.target.value.replace(/\D/g, "").slice(0, 3))} required className={field} /></Field>
              <Field label="Cidade"><input value={city} maxLength={48} onChange={(event) => setCity(event.target.value)} required className={field} /></Field>
              <Field label="Time que torce">
                <select value={team} onChange={(event) => setTeam(event.target.value as (typeof TEAMS)[number])} className={field}>
                  {TEAMS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </Field>
              <Field label="Camisa"><Size value={shirt} onChange={setShirt} /></Field>
              <Field label="Short ou calça"><Size value={bottom} onChange={setBottom} /></Field>
            </>
          ) : (
            <>
              <Field label="E-mail"><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required className={field} /></Field>
              {resetting ? null : <Field label="Senha"><input type="password" autoComplete="current-password" minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required className={field} /></Field>}
            </>
          )}
          {message ? <p className="text-sm text-accent" role="status">{message}</p> : null}
          <button type="submit" disabled={pending} className="mt-1 h-12 rounded-xl bg-accent text-base font-bold text-accent-ink disabled:opacity-60">
            {creating ? "Criar conta" : resetting ? "Enviar link" : "Entrar"}
          </button>
        </form>
        {creating || resetting ? (
          <button type="button" onClick={() => { setCreating(false); setResetting(false); setMessage(""); }} className="mt-4 text-sm font-semibold text-muted">Já tenho conta</button>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            <button type="button" onClick={() => { setCreating(true); setMessage(""); }} className="text-sm font-semibold text-muted">Criar conta</button>
            <button type="button" onClick={() => { const slip = readSlip(); router.push("/jogos" + (slip && slip.order.length ? "?bilhete=1" : "")); }} className="h-12 rounded-xl bg-card-2 text-base font-bold text-ink">Ver jogos</button>
            <button type="button" onClick={() => { setResetting(true); setMessage(""); }} className="text-sm font-semibold text-muted">Esqueci a senha</button>
          </div>
        )}
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-xs text-muted">
      {label}
      {children}
    </label>
  );
}

function Size({ value, onChange }: { value: string; onChange: (value: (typeof SIZES)[number]) => void }) {
  return (
    <select value={value} onChange={(event) => onChange(event.target.value as (typeof SIZES)[number])} className={field}>
      {SIZES.map((item) => <option key={item}>{item}</option>)}
    </select>
  );
}
