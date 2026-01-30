'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/hooks/use-auth'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/app'

  const { signInWithGoogle, signInWithEmail } = useAuth()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      await signInWithGoogle(redirectTo)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error signing in with Google')
      setLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setError(null)
    try {
      await signInWithEmail(email, redirectTo)
      setEmailSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending login link')
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
            <svg viewBox="0 0 32 32" className="w-9 h-9">
              <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
              <circle cx="16" cy="16" r="9" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
              <circle cx="16" cy="16" r="4" fill="hsl(var(--primary))" />
            </svg>
          </div>
          <span className="text-2xl font-heading text-foreground">Omnis</span>
        </Link>
        <p className="text-muted-foreground">Personal Symbolic Mapping System</p>
      </div>

      <div className="earth-card bg-card p-8">
        {emailSent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-secondary/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-lg font-heading text-secondary">
              Link sent!
            </div>
            <p className="text-muted-foreground">
              Check your inbox at <strong className="text-foreground">{email}</strong>
            </p>
            <Button
              variant="outline"
              onClick={() => setEmailSent(false)}
              className="w-full"
            >
              Send new link
            </Button>
          </div>
        ) : (
          <>
            {/* OAuth Buttons */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 gap-2 border-border hover:bg-muted/50"
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
                <div className="earth-divider w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  or with email
                </span>
              </div>
            </div>

            {/* Email Magic Link Form */}
            <form onSubmit={handleEmailSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 bg-background border-border"
                />
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading || !email}
              >
                {loading ? 'Sending...' : 'Send login link'}
              </Button>
            </form>

            {error && (
              <div className="mt-4 text-sm text-destructive text-center">
                {error}
              </div>
            )}

            <p className="mt-6 text-xs text-center text-muted-foreground">
              By signing in, you agree to our{' '}
              <a href="/terms" className="text-primary hover:underline">Terms of Service</a>
              {' '}and{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function LoginFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="w-10 h-10 mx-auto mb-4">
          <svg viewBox="0 0 32 32" className="w-9 h-9">
            <circle cx="16" cy="16" r="14" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.3" />
            <circle cx="16" cy="16" r="9" fill="none" stroke="hsl(var(--primary))" strokeWidth="1" opacity="0.5" />
            <circle cx="16" cy="16" r="4" fill="hsl(var(--primary))" />
          </svg>
        </div>
        <h1 className="text-2xl font-heading text-foreground">Omnis</h1>
        <p className="text-muted-foreground">Personal Symbolic Mapping System</p>
      </div>
      <div className="earth-card bg-card p-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Suspense fallback={<LoginFallback />}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
