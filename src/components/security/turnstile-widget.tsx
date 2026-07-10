'use client'

import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile widget (explicit render). Env-gated: with no
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` it renders nothing and immediately reports an
 * empty token, so forms stay usable in dev/unconfigured environments (the
 * server verifier is likewise a no-op then — see lib/security/turnstile.ts).
 *
 * Pass a STABLE `onVerify` (e.g. a useState setter) — it's an effect dependency.
 */
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string
          callback: (token: string) => void
          'expired-callback'?: () => void
          'error-callback'?: () => void
          theme?: 'auto' | 'light' | 'dark'
        },
      ) => string
      remove: (id: string) => void
    }
  }
}

export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) {
      onVerify('') // disabled → forms proceed; server also allows
      return
    }

    function render() {
      if (!ref.current || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: SITE_KEY as string,
        theme: 'auto',
        callback: (token) => onVerify(token),
        'expired-callback': () => onVerify(''),
        'error-callback': () => onVerify(''),
      })
    }

    if (window.turnstile) {
      render()
    } else {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src^="${SCRIPT_SRC.split('?')[0]}"]`,
      )
      if (existing) {
        existing.addEventListener('load', render)
      } else {
        const s = document.createElement('script')
        s.src = SCRIPT_SRC
        s.async = true
        s.defer = true
        s.onload = render
        document.head.appendChild(s)
      }
    }

    return () => {
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current)
        } catch {
          // widget already gone
        }
        widgetId.current = null
      }
    }
  }, [onVerify])

  if (!SITE_KEY) return null
  return <div ref={ref} className="cf-turnstile" />
}
