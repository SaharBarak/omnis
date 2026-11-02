/**
 * Pleiad service worker.
 *
 * Deliberately minimal: its job is installability plus a graceful offline page,
 * NOT aggressive asset caching. Caching hashed Next.js build output here would
 * fight the CDN and risk serving stale chunks after a deploy.
 *
 * Strategy:
 *   - navigations: network-first, fall back to the cached offline page
 *   - everything else: passthrough (let the CDN + HTTP cache do their job)
 *
 * Bump CACHE_VERSION to evict old caches on the next activation.
 */

const CACHE_VERSION = 'pleiad-v1'
const OFFLINE_URL = '/offline'
const PRECACHE = [OFFLINE_URL, '/icons/icon-192x192.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle top-level navigations; let all subresources go to the network.
  if (request.mode !== 'navigate' || request.method !== 'GET') return

  event.respondWith(
    fetch(request).catch(async () => {
      const cache = await caches.open(CACHE_VERSION)
      return (await cache.match(OFFLINE_URL)) ?? Response.error()
    })
  )
})
