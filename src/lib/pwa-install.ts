type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;

export function installEvent() {
  return deferred;
}

export function listenForInstall() {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    window.dispatchEvent(new Event("betdobem-install"));
  });
  window.addEventListener("appinstalled", () => {
    localStorage.setItem("betdobem.pwa.instalado", "1");
    deferred = null;
  });
}

export function standalone() {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function installPromptWillShow(signedIn: boolean) {
  if (!signedIn) return false;
  if (sessionStorage.getItem("betdobem.pwa.depois") === "1") return false;
  if (standalone()) return false;
  if (localStorage.getItem("betdobem.pwa.instalado") === "1") return false;
  return true;
}

export async function clearStaleInstall() {
  if (standalone() || localStorage.getItem("betdobem.pwa.instalado") !== "1") return;
  const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<{ platform: string }[]> };
  if (!nav.getInstalledRelatedApps) return;
  const related = await nav.getInstalledRelatedApps().catch(() => null);
  if (related && related.length === 0) localStorage.removeItem("betdobem.pwa.instalado");
}
