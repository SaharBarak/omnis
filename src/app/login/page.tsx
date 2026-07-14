'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { BrandMark } from '@/components/brand-mark'
import { StarParallax } from '@/components/landing-v2'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { track } from '@/lib/analytics/posthog'
import { useAuth } from '@/lib/hooks/use-auth'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [linkSent, setLinkSent] = useState(false)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/app'

  const { signInWithGoogle, signInWithEmail } = useAuth()

  const handleGoogleSignIn = async () => {
    track('signup_started', { method: 'google' })
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error signing in with Google')
      setLoading(false)
    }
  }

  // Email is a magic link: it resolves in place rather than navigating, so the
  // form has to say so — otherwise a successful send looks like a dead button.
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    track('signup_started', { method: 'email' })
    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, redirectTo)
      setLinkSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error continuing with email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      {/* Logo */}
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 flex items-center justify-center">
            <BrandMark size={36} className="w-9 h-9" />
          </div>
          <span className="text-2xl font-display font-semibold tracking-tight text-white">Pleiad</span>
        </Link>
        <p className="text-white/50">The living map of your people</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
        <>
            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 gap-2 border-white/15 bg-transparent text-white hover:bg-white/5 hover:text-white active:scale-[0.98]"
                onClick={handleGoogleSignIn}
                disabled={loading}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#12141F] px-2 text-white/40">
                  or with email
                </span>
              </div>
            </div>

            {/* Email Magic Link Form */}
            {linkSent ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.04] p-4 text-center">
                <p className="text-sm text-white">Check your inbox</p>
                <p className="mt-1 text-xs text-white/50">
                  We sent a sign-in link to {email}. Open it on this device.
                </p>
                <button
                  type="button"
                  onClick={() => setLinkSent(false)}
                  className="mt-3 text-xs text-brand-soft hover:underline"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/70">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11 bg-white/[0.04] border-white/15 text-white placeholder:text-white/30"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 rounded-xl bg-brand hover:bg-brand/90 text-white active:scale-[0.98]"
                  disabled={loading || !email}
                >
                  {loading ? 'Sending link…' : 'Continue with email'}
                </Button>
              </form>
            )}

            {error && (
              <div className="mt-4 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <p className="mt-6 text-xs text-center text-white/40">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-brand-soft hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-brand-soft hover:underline">Privacy Policy</a>
            </p>
        </>
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-10 h-10 mx-auto mb-4">
          <BrandMark size={36} className="w-9 h-9" />
        </div>
        <h1 className="text-2xl font-display font-semibold tracking-tight text-white">Pleiad</h1>
        <p className="text-white/50">The living map of your people</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 flex items-center justify-center">
        <div className="text-white/50">Loading...</div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden bg-[#0B0D16] p-6">
      {/* Same ambient sky as every other page — a bare black void read as a
          different product. */}
      <StarParallax />
      <div className="relative">
        <Suspense fallback={<LoginFallback />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}
