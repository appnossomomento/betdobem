"use client";

import { useEffect, useState } from "react";
import { clearStaleInstall, installEvent, installPromptWillShow, standalone } from "@/lib/pwa-install";

type Kind = "ios" | "android" | "desktop" | "webview";

const steps: Record<Kind, string[]> = {
  ios: [
    "Toque em Compartilhar, na barra do Safari.",
    "Toque em Adicionar à Tela de Início.",
    "Toque em Adicionar.",
    "Abra o BETdoBEM pelo ícone, não por esta aba.",
  ],
  android: ["Abra o menu do Chrome e toque em Instalar app ou Adicionar à tela inicial."],
  desktop: ["O BETdoBEM ganha um ícone na barra de tarefas e uma janela só dele, sem abas. Se o botão Instalar não aparecer, use o ícone de instalação na barra de endereço."],
  webview: ["Abra esta página no Chrome para instalar o app."],
};

export function InstallPrompt({ signedIn }: { signedIn: boolean }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("desktop");
  const [step, setStep] = useState(0);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    if (installPromptWillShow(true)) sessionStorage.removeItem("betdobem.enquete");
    if (!installPromptWillShow(true)) return;
    let cancel = false;
    clearStaleInstall().then(() => {
      if (cancel || standalone() || localStorage.getItem("betdobem.pwa.instalado") === "1") return;
      if (sessionStorage.getItem("betdobem.pwa.depois") === "1") return;
      setKind(deviceKind());
      setCanInstall(Boolean(installEvent()));
      setOpen(true);
    });
    const ready = () => setCanInstall(true);
    window.addEventListener("betdobem-install", ready);
    return () => {
      cancel = true;
      window.removeEventListener("betdobem-install", ready);
    };
  }, [signedIn]);

  if (!open) return null;
  const list = kind === "android" && canInstall ? ["Toque em Instalar. O Chrome coloca o ícone na tela inicial."] : steps[kind];
  const last = step >= list.length - 1;
  const native = canInstall && (kind === "android" || kind === "desktop");

  function later() {
    sessionStorage.setItem("betdobem.pwa.depois", "1");
    setOpen(false);
  }

  async function install() {
    const event = installEvent();
    if (!event) return;
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") localStorage.setItem("betdobem.pwa.instalado", "1");
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 px-4 pb-[calc(88px+env(safe-area-inset-bottom))] min-[880px]:place-items-center min-[880px]:pb-4">
      <section className="w-full max-w-md rounded-[18px] border border-line bg-card p-5">
        <p className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">Instalar</p>
        <h2 className="mt-1 text-lg tracking-tight">Coloque o BETdoBEM na tela de início</h2>
        <p className="mt-3 text-sm">{list[step]}</p>
        <p className="mt-2 text-xs text-muted tabular-nums">{step + 1} de {list.length}</p>
        <div className="mt-4 flex gap-2">
          {native && last ? (
            <button type="button" onClick={install} className="h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-ink">Instalar</button>
          ) : last ? (
            <button type="button" onClick={later} className="h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-ink">Entendi</button>
          ) : (
            <button type="button" onClick={() => setStep((value) => value + 1)} className="h-11 flex-1 rounded-xl bg-accent text-sm font-bold text-accent-ink">Próximo</button>
          )}
          <button type="button" onClick={later} className="h-11 rounded-xl bg-card-2 px-4 text-sm font-semibold">Agora não</button>
        </div>
      </section>
    </div>
  );
}

function deviceKind(): Kind {
  const ua = navigator.userAgent;
  if (/Instagram|FBAN|FBAV/.test(ua)) return "webview";
  const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}
