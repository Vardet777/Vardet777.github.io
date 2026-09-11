const CACHE = "linnea-shell-v13";
const SHELL = ["./","./index.html","./manifest.webmanifest","./js/app.js","./js/linnea-runtime.js","./js/atlas.js","./js/legal.js","./js/sync-merge.js","./js/plugins.js","./js/providers.js","./js/composer.js"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.pathname.includes("/api/")) return;
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request).then((res) => {
    if (event.request.method === "GET" && res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(event.request, copy));
    }
    return res;
  }).catch(() => caches.match("./index.html"))));
});
