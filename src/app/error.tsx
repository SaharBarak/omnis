'use client'

import { useEffect } from 'react'

/**
 * Route-level error boundary. Catches render/data errors in the app tree and
 * shows a recoverable screen instead of a blank page or a leaked stack trace.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // The digest is safe to surface; the message/stack are not shown to users.
    console.error('App error', error.digest ?? error.message)
  }, [error])

  return (
    <div className="relative flex min-h-[100dvh] flex-col items-center justify-center bg-[#0B0D16] px-6 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-brand-soft">
        Something broke
      </p>
      <h1 className="mt-3 text-2xl font-display font-semibold text-white">
        We hit an unexpected error
      </h1>
      <p className="mt-2 max-w-sm text-white/50">
        It&apos;s been logged. Try again, and if it keeps happening, head back home.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-white/30">ref: {error.digest}</p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-brand px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand/90"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5"
        >
          Back home
        </a>
      </div>
    </div>
  )
}
