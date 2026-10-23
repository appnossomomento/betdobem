const cacheName = "betdobem-shell-v1";
const precache = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/logo-bet-do-bem/LogoPrincipal-completo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(precache)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== cacheName).map((key) => caches.delete(key)))),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/auth")) return;
  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/icons/") || url.pathname.startsWith("/logo-bet-do-bem/")) {
    event.respondWith(fromCache(event.request));
    return;
  }
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
  }
});

self.addEventListener("push", (event) => {
  const data = readPush(event);
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: data.tag,
      data: { url: data.url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/jogos", self.location.origin).href;
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const open = windows.find((window) => window.url.startsWith(self.location.origin));
      if (open) {
        open.focus();
        if ("navigate" in open) return open.navigate(target);
      }
      return self.clients.openWindow(target);
    }),
  );
});

function fromCache(request) {
  return caches.open(cacheName).then(async (cache) => {
    const hit = await cache.match(request);
    try {
      const response = await fetch(request);
      if (response.ok) cache.put(request, response.clone());
      return response;
    } catch {
      return hit || Response.error();
    }
  });
}

function readPush(event) {
  const fallback = { title: "BETdoBEM", body: "", url: "/jogos", tag: "betdobem" };
  if (!event.data) return fallback;
  try {
    const data = event.data.json();
    const note = data.notification || {};
    const inner = data.data || data;
    return {
      title: inner.title || data.title || note.title || fallback.title,
      body: inner.body || data.body || note.body || "",
      url: inner.url || data.url || data.link || "/jogos",
      tag: inner.tag || data.tag || fallback.tag,
    };
  } catch {
    return { ...fallback, body: event.data.text() };
  }
}
