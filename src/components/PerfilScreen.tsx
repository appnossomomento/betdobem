"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAvatar, saveAvatar } from "@/lib/avatar";
import type { Account } from "@/lib/account";
import { saveProfile } from "@/lib/profile-save";
import { SIZES, TEAMS, formatCpf } from "@/lib/profile-fields";
import { createClient } from "@/lib/supabase/client";
import { standalone } from "@/lib/pwa-install";
import { saoPauloDay } from "@/lib/market";

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
  const [photo, setPhoto] = useState(account.avatarUrl);
  const [photoNote, setPhotoNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    const result = await saveProfile({ nick, age: Number(age), city, favoriteTeam: team, shirtSize: shirt, bottomSize: bottom });
    setPending(false);
    setMessage(result.ok ? "Salvo." : result.error);
    if (result.ok) router.refresh();
  }

  async function onFile(file: File | undefined) {
    if (!file || uploading) return;
    const types = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const named = /\.(jpe?g|png|webp|gif)$/i.test(file.name);
    if ((!types.includes(file.type) && !named) || (file.type && !types.includes(file.type)) || file.size > 2 * 1024 * 1024) {
      setPhotoNote("Use JPG, PNG, WEBP ou GIF de até 2 MB.");
      return;
    }
    setUploading(true);
    setPhotoNote("");
    try {
      const dataUrl = await squarePhoto(file);
      const result = await saveAvatar(dataUrl);
      if (!result.ok) {
        setPhotoNote(result.error);
        return;
      }
      setPhoto(result.url);
      setPhotoNote("Salvo.");
      router.refresh();
    } catch (error) {
      setPhotoNote(error instanceof Error ? error.message : "Não foi possível ler essa imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    const result = await clearAvatar();
    setUploading(false);
    if (!result.ok) {
      setPhotoNote(result.error);
      return;
    }
    setPhoto("");
    setPhotoNote("Salvo.");
    router.refresh();
  }

  async function leave() {
    const { disablePush } = await import("@/lib/enable-push");
    await disablePush();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-[18px] border border-line bg-card p-5">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Foto" className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-full bg-accent text-lg font-bold text-accent-ink disabled:opacity-60">
          {photo ? <img src={photo} alt="" className="size-full object-cover" /> : account.initials}
        </button>
        <div>
          <h1 className="text-xl">{account.displayName}</h1>
          <p className="text-sm text-muted">{account.email}</p>
          <div className="mt-1 flex gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-sm font-semibold text-accent disabled:opacity-60">Foto</button>
            {photo ? <button type="button" onClick={removePhoto} disabled={uploading} className="text-sm font-semibold text-muted disabled:opacity-60">Remover</button> : null}
          </div>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
        className="hidden"
        onChange={(event) => {
          onFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
      {photoNote ? <p className="mt-3 text-sm text-accent" role="status">{photoNote}</p> : null}
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
      <PushRetry />
      <button type="button" onClick={leave} className="mt-4 h-12 w-full rounded-xl bg-[#c4292e] text-base font-bold text-white">Sair</button>
    </section>
  );
}

function PushRetry() {
  const [state, setState] = useState<"off" | "on" | "denied" | "later" | "ask">("off");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!standalone() || !("Notification" in window)) return;
    const today = saoPauloDay(Date.now());
    const denied = Notification.permission === "denied" || localStorage.getItem("betdobem.push.negado") === "1";
    if (Notification.permission === "granted") {
      setState("on");
      return;
    }
    if (denied) {
      setState("denied");
      return;
    }
    if (localStorage.getItem("betdobem.push.adiado") === today) {
      setState("later");
      return;
    }
    fetch("/api/push/config")
      .then((response) => response.json())
      .then((data: { ok?: boolean }) => {
        if (data.ok) setState("ask");
      })
      .catch(() => undefined);
  }, []);

  if (state === "off") return null;

  async function retry() {
    localStorage.removeItem("betdobem.push.negado");
    const { enablePush } = await import("@/lib/enable-push");
    const result = await enablePush();
    if (result.ok) {
      setState("on");
      setNote("Notificações ligadas.");
      return;
    }
    if (result.error === "denied") {
      localStorage.setItem("betdobem.push.negado", "1");
      setState("denied");
    }
    setNote(result.error === "denied" ? "As notificações ficam nos ajustes do sistema, dentro do app instalado." : "Não foi possível ligar agora.");
  }

  const label = state === "on" ? "Notificações ligadas." : state === "denied" ? "Notificações desligadas." : state === "later" ? "Notificações adiadas até amanhã." : "Notificações desligadas.";

  return (
    <div className="mt-4">
      <p className="text-sm">{label}</p>
      {state === "ask" ? <button type="button" onClick={retry} className="mt-2 h-12 w-full rounded-xl bg-card-2 text-sm font-semibold">Ativar notificações</button> : null}
      {note ? <p className="mt-2 text-sm text-muted">{note}</p> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="text-xs text-muted">{label}{children}</label>;
}

async function squarePhoto(file: File) {
  const bitmap = await createImageBitmap(file);
  const ratio = bitmap.width / bitmap.height;
  if (!bitmap.width || !bitmap.height || ratio < 0.6 || ratio > 1.7) {
    bitmap.close();
    throw new Error("A imagem precisa ser quase quadrada.");
  }
  const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Não foi possível ler essa imagem.");
  }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
  if (!blob) throw new Error("Não foi possível ler essa imagem.");
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler essa imagem."));
    reader.readAsDataURL(blob);
  });
}
