import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Offline',
  description: 'You are offline.',
  robots: { index: false, follow: false },
}

/**
 * Offline fallback, precached by /sw.js and served when a navigation fails.
 * Intentionally dependency-free — no fonts, no images, no client JS — so it
 * renders from cache with nothing else available.
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-semibold">You&apos;re offline</h1>
      <p className="max-w-sm text-sm opacity-70">
        Pleiad needs a connection to read charts. Your saved people are still here — reconnect and
        this page will pick up where you left off.
      </p>
    </main>
  )
}
