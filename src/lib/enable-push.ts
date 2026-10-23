type PublicConfig = {
  ok: true;
  apiKey: string;
  authDomain: string;
  projectId: string;
  messagingSenderId: string;
  appId: string;
  vapidKey: string;
};

export async function enablePush(): Promise<{ ok: true } | { ok: false; error: "denied" | "config" | "token" | "grava" }> {
  const response = await fetch("/api/push/config");
  const config = (await response.json()) as PublicConfig | { ok: false };
  if (!config.ok) return { ok: false, error: "config" };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { ok: false, error: "denied" };
  const registration = await navigator.serviceWorker.ready;
  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken } = await import("firebase/messaging");
  const app = getApps()[0] ?? initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId,
    messagingSenderId: config.messagingSenderId,
    appId: config.appId,
  });
  const token = await getToken(getMessaging(app), { vapidKey: config.vapidKey, serviceWorkerRegistration: registration });
  if (!token) return { ok: false, error: "token" };
  sessionStorage.setItem("betdobem.push.token", token);
  const saved = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return saved.ok ? { ok: true } : { ok: false, error: "grava" };
}

export async function disablePush() {
  const token = sessionStorage.getItem("betdobem.push.token");
  if (token) {
    await fetch("/api/push/unsubscribe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => undefined);
    sessionStorage.removeItem("betdobem.push.token");
  }
  const registration = await navigator.serviceWorker?.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  await subscription?.unsubscribe().catch(() => undefined);
}
