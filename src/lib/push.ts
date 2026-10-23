import "server-only";
import { createSign } from "node:crypto";
import { readBoard } from "@/lib/admin-store";
import { saoPauloDay } from "@/lib/market";
import { createAdminClient } from "@/lib/supabase/admin";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };

export type PushKind = "mercado_aberto" | "partidas_iniciando";

const copy: Record<PushKind, { title: string; body: string }> = {
  mercado_aberto: { title: "Mercado aberto", body: "Faça suas apostas." },
  partidas_iniciando: { title: "Partidas iniciando", body: "Faça suas apostas para não perder a rodada." },
};

export function firebaseAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccount>;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return { project_id: parsed.project_id, client_email: parsed.client_email, private_key: parsed.private_key };
  } catch {
    return null;
  }
}

export function firebasePublic() {
  const apiKey = process.env.FIREBASE_WEB_API_KEY;
  const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.FIREBASE_APP_ID;
  const vapidKey = process.env.FIREBASE_WEB_VAPID_KEY;
  if (!apiKey || !authDomain || !projectId || !messagingSenderId || !appId || !vapidKey) return null;
  return { apiKey, authDomain, projectId, messagingSenderId, appId, vapidKey };
}

export async function dispatchKind(kind: PushKind, manual = false) {
  const account = firebaseAccount();
  const day = saoPauloDay(Date.now());
  const deliveryKind = manual ? `manual-${kind}-${Date.now()}` : kind;
  if (!account) return { ok: true as const, skipped: "firebase" as const, sent: 0 };
  const admin = createAdminClient();
  const board = await readBoard();
  const { data: bannedProfiles } = await admin.from("profiles").select("id").not("banned_at", "is", null);
  const banned = new Set<string>([...board.banned, ...((bannedProfiles ?? []).map((row) => row.id as string))]);
  const { data: rows } = await admin.from("push_subscriptions").select("user_id, token");
  const targets = (rows ?? []).filter((row) => row.token && !banned.has(row.user_id as string));
  const access = await accessToken(account);
  let sent = 0;
  for (const row of targets) {
    const token = row.token as string;
    const { error: logged } = await admin.from("push_deliveries").insert({ kind: deliveryKind, day, token, status: "sent" });
    if (logged) continue;
    const result = await send(account, access, token, kind, deliveryKind);
    if (result === "drop") {
      await admin.from("push_subscriptions").delete().eq("token", token);
      await admin.from("push_deliveries").update({ status: "dropped" }).eq("kind", deliveryKind).eq("day", day).eq("token", token);
      continue;
    }
    if (result === "fail") {
      await admin.from("push_deliveries").update({ status: "failed" }).eq("kind", deliveryKind).eq("day", day).eq("token", token);
      continue;
    }
    sent += 1;
  }
  return { ok: true as const, skipped: null, sent };
}

async function send(account: ServiceAccount, access: string, token: string, kind: PushKind, tag: string) {
  const message = copy[kind];
  const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.project_id}/messages:send`, {
    method: "POST",
    headers: { authorization: `Bearer ${access}`, "content-type": "application/json" },
    body: JSON.stringify({
      message: {
        token,
        data: { title: message.title, body: message.body, url: "/jogos", tag },
      },
    }),
  });
  if (response.ok) return "ok";
  if (response.status === 404) return "drop";
  const body = await response.text();
  if (response.status === 400 && /UNREGISTERED|NOT_FOUND/.test(body)) return "drop";
  return "fail";
}

async function accessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const sign = createSign("RSA-SHA256");
  sign.update(`${header}.${claim}`);
  const assertion = `${header}.${claim}.${sign.sign(account.private_key).toString("base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("FCM sem access token");
  return data.access_token;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}
