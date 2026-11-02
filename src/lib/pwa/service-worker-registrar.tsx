'use client'

/**
 * Registers /sw.js after the page is interactive.
 *
 * Registration is deferred to the `load` event so the worker never competes
 * with first paint, and is skipped entirely in development — a stale dev
 * service worker is a notorious source of "why isn't my change showing up".
 */

import { useEffect } from 'react'

export function ServiceWorkerRegistrar(): null {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Registration failure must never break the page — the app works fine
        // without offline support.
      })
    }

    if (document.readyState === 'complete') register()
    else {
      window.addEventListener('load', register)
      return () => window.removeEventListener('load', register)
    }
  }, [])

  return null
}
