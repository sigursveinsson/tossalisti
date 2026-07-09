const CACHE = 'tossalisti-v3'

self.addEventListener('install', () => self.skipWaiting())

self.addEventListener('activate', (e) => e.waitUntil(
  caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())
))

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return

  // HTML/leiðsögn: network-first — svo ný útgáfa (og réttar hash-skrár) hlaðist alltaf ferskt.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}) }
          return res
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    )
    return
  }

  // Eignir (hash-nefndar, óbreytanlegar): cache-first, sækja af neti ef vantar. Aldrei cache-a 404/villusvör.
  e.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic') {
        const copy = res.clone()
        caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {})
      }
      return res
    }))
  )
})

// Push-tilkynningar (opt-in — sendar aðeins til þeirra sem kveikja á áminningum)
self.addEventListener('push', (e) => {
  let data = {}
  try { data = e.data ? e.data.json() : {} } catch { data = { body: e.data && e.data.text() } }
  const title = data.title || 'Tossalisti'
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'tossalisti',
    data: { url: data.url || '/' },
  }
  e.waitUntil(self.registration.showNotification(title, options))
})

// Smella á tilkynningu → opna/fókusa appið
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  const url = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) { if ('focus' in c) { c.navigate(url).catch(() => {}); return c.focus() } }
      if (self.clients.openWindow) return self.clients.openWindow(url)
    })
  )
})
