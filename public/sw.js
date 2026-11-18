// Tesbihat — sade bir app-shell service worker (çevrimdışı açılış)
const CACHE = 'tesbihat-v31'
const SHELL = ['./', './index.html', './manifest.webmanifest']

self.addEventListener('install', (e) => {
  self.skipWaiting()
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => undefined))
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const { request } = e
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  // API çağrıları: ağ öncelikli, düşerse sessiz (uygulamanın çevrimdışı hesabı var)
  if (url.hostname.includes('aladhan.com')) {
    e.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }
  // Uygulama kabuğu: önbellek öncelikli, ağdan tazele
  e.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok && url.origin === self.location.origin) {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})
