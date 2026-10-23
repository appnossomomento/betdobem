"use client";

import { useEffect, useState } from "react";
import { standalone } from "@/lib/pwa-install";
import { saoPauloDay } from "@/lib/market";

export function NotifyPrompt({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!signedIn || !standalone()) return;
    if (!("Notification" in window) || Notification.permission !== "default") return;
    if (localStorage.getItem("betdobem.push.negado") === "1") return;
    const today = saoPauloDay(Date.now());
    if (localStorage.getItem("betdobem.push.adiado") === today) return;
    let cancel = false;
    fetch("/api/push/config")
      .then((response) => response.json())
      .then((data: { ok?: boolean }) => {
        if (!cancel && data.ok) setOpen(true);
      })
      .catch(() => undefined);
    return () => {
      cancel = true;
    };
  }, [signedIn]);

  if (!open) return null;

  async function enable() {
    const { enablePush } = await import("@/lib/enable-push");
    const result = await enablePush();
    if (result.ok) {
      setOpen(false);
      return;
    }
    if (result.error === "denied") {
      localStorage.setItem("betdobem.push.negado", "1");
      setNote("As notificações ficam nos ajustes do sistema, dentro do app instalado.");
      return;
    }
    setNote("Não foi possível ligar agora.");
  }

  function later() {
    localStorage.setItem("betdobem.push.adiado", saoPauloDay(Date.now()));
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] min-[880px]:place-items-center min-[880px]:pb-4">
      <section className="w-full max-w-md rounded-[18px] border border-line bg-card p-5">
        <h2 className="text-lg tracking-tight">Ativar notificações</h2>
        <p className="mt-2 text-sm text-muted">O aviso de mercado aberto e o de partidas iniciando chegam neste app.</p>
        {note ? <p className="mt-3 text-sm">{note}</p> : null}
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={enable} className="h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-ink">Ativar notificações</button>
          <button type="button" onClick={later} className="h-11 rounded-xl bg-card-2 px-4 text-sm font-semibold">Agora não</button>
        </div>
      </section>
    </div>
  );
}
