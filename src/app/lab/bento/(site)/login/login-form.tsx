'use client'

import { useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import s from './login.module.css'
import { PixelVideo } from '@/components/bento-lab'
import { Field, PrimaryAction, site } from '@/components/bento-lab/site'
import { safeRedirect } from '@/lib/auth/safe-redirect'
import { PORTAL_LOOP } from '@/lib/data/lab-media'
import { useAuth } from '@/lib/hooks/use-auth'
import { AUTH_RETURN_PARAM, siteHref } from '@/lib/site/routes'

type Mode = 'signin' | 'signup'

const message = (err: unknown, fallback: string): string => (err instanceof Error ? err.message : fallback)

export function LoginForm() {
  const params = useSearchParams()
  const router = useRouter()
  const returnTo = safeRedirect(params.get(AUTH_RETURN_PARAM), siteHref('/app'))
  const { signInWithGoogle, signInWithPassword, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const run = async (task: () => Promise<void>, fallback: string) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await task()
    } catch (err) {
      setError(message(err, fallback))
    } finally {
      setBusy(false)
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!email || !password) return
    void run(async () => {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email, password, returnTo)
        if (needsConfirmation) {
          setNotice('Check your inbox to confirm the address, then sign in.')
          setMode('signin')
          setPassword('')
          return
        }
      } else {
        await signInWithPassword(email, password)
      }
      router.replace(returnTo)
    }, 'Something went wrong')
  }

  const reset = () => {
    if (!email) {
      setError('Enter your email first, then ask for a reset link.')
      return
    }
    void run(async () => {
      await resetPassword(email)
      setNotice(`A reset link is on its way to ${email}.`)
    }, 'Could not send a reset link')
  }

  return (
    <div className={`${site.page} ${s.wrap}`}>
      <div className={s.art}>
        <PixelVideo media={PORTAL_LOOP} preload="auto" />
        <div className={s.artText}>
          <h2 className={site.h2}>Your people, kept on one map</h2>
          <p style={{ margin: 0, color: 'var(--lab-on-media-2)', maxWidth: '44ch' }}>
            Save birth data once. Every map, pair and circle is drawn from it, and nothing leaves your account unless
            you share it.
          </p>
        </div>
      </div>
      <form className={s.card} onSubmit={submit} noValidate>
        <h1 className={site.h2}>{mode === 'signin' ? 'Sign in' : 'Create an account'}</h1>
        <div className={s.tabs} role="group" aria-label="Account">
          <button type="button" aria-pressed={mode === 'signin'} onClick={() => setMode('signin')}>
            Sign in
          </button>
          <button type="button" aria-pressed={mode === 'signup'} onClick={() => setMode('signup')}>
            New account
          </button>
        </div>
        <button
          type="button"
          className={site.btn}
          disabled={busy}
          onClick={() => void run(() => signInWithGoogle(returnTo), 'Could not open Google sign-in')}
        >
          Continue with Google
        </button>
        <Field id="login-email" label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field
          id="login-password"
          label="Password"
          type="password"
          autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          hint={mode === 'signup' ? 'At least 8 characters.' : undefined}
        />
        {error && (
          <p className={site.error} role="alert" style={{ margin: 0, fontSize: 14 }}>
            {error}
          </p>
        )}
        {notice && (
          <p className={s.notice} role="status" style={{ margin: 0 }}>
            {notice}
          </p>
        )}
        <PrimaryAction type="submit" disabled={busy || !email || !password}>
          {busy ? 'Working' : mode === 'signin' ? 'Sign in' : 'Create account'}
        </PrimaryAction>
        {mode === 'signin' && (
          <button type="button" className={site.textLink} style={{ justifySelf: 'start', fontSize: 14 }} onClick={reset} disabled={busy}>
            Forgot the password
          </button>
        )}
      </form>
    </div>
  )
}
