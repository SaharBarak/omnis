'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { track } from '@/lib/analytics/posthog'
import { useAuth } from '@/lib/hooks/use-auth'
import { BrandMark } from '@/components/brand-mark'

function LoginForm() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter()
  const redirectTo = searchParams.get('redirectTo') || '/app'

  const { signInWithGoogle, signInWithPassword, signUp, resetPassword } = useAuth()

  const handleGoogle = async () => {
    track('signup_started', { method: 'google' })
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await signInWithGoogle(redirectTo)
      // Navigates to Google; nothing after this runs on success.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error signing in with Google')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    track('signup_started', { method: mode === 'signup' ? 'email_signup' : 'email_password' })
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email, password, redirectTo)
        if (needsConfirmation) {
          setNotice('Check your inbox to confirm your email, then sign in.')
          setMode('signin')
          setPassword('')
          return
        }
      } else {
        await signInWithPassword(email, password)
      }
      // Session is live; the middleware will admit us to the gated route.
      router.replace(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    if (!email) {
      setError('Enter your email first, then tap reset.')
      return
    }
    setLoading(true)
    setError(null)
    setNotice(null)
    try {
      await resetPassword(email)
      setNotice(`We sent a password reset link to ${email}.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send reset link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-[28px] bg-white px-8 py-10 shadow-2xl">
        {/* Six-System Seal */}
        <div className="mb-8 flex justify-center">
          <BrandMark size={56} mono className="text-brand" />
        </div>

        <h1 className="text-center text-[28px] font-bold text-gray-900">Welcome</h1>
        <p className="mt-2 text-center text-[15px] leading-snug text-gray-500">
          {mode === 'signin'
            ? 'Sign in to continue to Pleiad.'
            : 'Create your account to continue to Pleiad.'}
        </p>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white text-[15px] font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs uppercase tracking-wide text-gray-400">or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email address <span className="text-brand">*</span>
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 w-full rounded-full border border-gray-300 px-4 text-[15px] text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password <span className="text-brand">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                className="h-12 w-full rounded-full border border-gray-300 pl-4 pr-16 text-[15px] text-gray-900 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-sm text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
            {mode === 'signin' && (
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className="mt-2 text-sm text-brand hover:underline disabled:opacity-50"
              >
                Reset password
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="h-12 w-full rounded-full bg-brand text-[15px] font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Continue'}
          </button>
        </form>

        {notice && (
          <div className="mt-4 rounded-xl bg-gray-100 p-3 text-center text-sm text-gray-700">
            {notice}
          </div>
        )}
        {error && (
          <div className="mt-4 text-center text-sm text-red-600">{error}</div>
        )}

        <p className="mt-8 text-center text-sm text-gray-600">
          {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
              setError(null)
              setNotice(null)
            }}
            className="font-medium text-brand hover:underline"
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-white/40">
        By continuing, you agree to our{' '}
        <Link href="/terms" className="text-white/60 hover:underline">Terms</Link>
        {' '}and{' '}
        <Link href="/privacy" className="text-white/60 hover:underline">Privacy Policy</Link>
      </p>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="w-full max-w-[400px]">
      <div className="rounded-[28px] bg-white px-8 py-10 shadow-2xl flex items-center justify-center min-h-[320px]">
        <div className="text-gray-400">Loading…</div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center bg-black p-6">
      <div className="relative">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
