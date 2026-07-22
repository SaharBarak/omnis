'use client'

import { useState, type FormEvent } from 'react'

import { TurnstileWidget } from '@/components/security/turnstile-widget'

/**
 * Newsletter / waitlist signup. Posts to /api/newsletter/subscribe, which
 * records a *pending* subscriber and emails a signed confirmation link —
 * double opt-in, so nothing is delivered until the recipient clicks it. The
 * success copy comes from the route, which returns one constant message for
 * every branch so the form can't be used to probe list membership. Turnstile is
 * env-gated (no-op token when unconfigured), so the form works in dev and is
 * bot-guarded in prod.
 */

type Status = 'idle' | 'submitting' | 'success' | 'error'

export function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    setMessage('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, turnstileToken: token }),
      })
      const data: { message?: string; error?: string } = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('success')
        setMessage(data.message ?? "You're in! Check your inbox.")
        setEmail('')
      } else {
        setStatus('error')
        setMessage(data.error ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Please try again.')
    }
  }

  if (status === 'success') {
    return (
      <p className="text-sm text-brand-soft" role="status">
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="mx-auto flex w-full max-w-md flex-col gap-3">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          autoComplete="email"
          className="flex-1 rounded-xl border border-white/15 bg-surface-2 px-4 py-3 text-sm text-white placeholder-white/35 outline-none transition focus:border-brand-soft"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="rounded-xl bg-brand px-6 py-3 text-sm font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {status === 'submitting' ? 'Joining…' : 'Get daily kins'}
        </button>
      </div>
      <TurnstileWidget onVerify={setToken} />
      {status === 'error' && (
        <p className="text-sm text-red-400" role="alert">
          {message}
        </p>
      )}
      <p className="text-xs text-white/35">
        Today&apos;s Kin + sky phenomena, once a day. We&apos;ll email you a link to confirm.
        Unsubscribe anytime.
      </p>
    </form>
  )
}
