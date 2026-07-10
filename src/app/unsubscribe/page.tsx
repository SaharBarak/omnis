'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function UnsubscribeContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const errorParam = searchParams.get('error')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string } | null>(
    success ? { success: true, message: 'You have been unsubscribed.' } : null
  )

  const handleUnsubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      const response = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() })
      })

      const data = await response.json()
      setResult({
        success: response.ok,
        message: response.ok
          ? 'You have been unsubscribed from the Daily Kin newsletter.'
          : data.error || 'Failed to unsubscribe. Please try again.'
      })
    } catch {
      setResult({
        success: false,
        message: 'An error occurred. Please try again later.'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-accent text-2xl">*</span>
            <span className="font-bold text-xl">PLEIAD</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">Unsubscribe</h1>
          <p className="text-muted-foreground">
            We&apos;re sorry to see you go.
          </p>
        </div>

        {/* Result message */}
        {result ? (
          <div className={`glass rounded-xl p-6 text-center ${result.success ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <div className={`text-4xl mb-4 ${result.success ? 'text-green-500' : 'text-red-500'}`}>
              {result.success ? '✓' : '✗'}
            </div>
            <p className={`mb-6 ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.message}
            </p>
            {result.success && (
              <p className="text-sm text-muted-foreground mb-6">
                You can always resubscribe by visiting our website.
              </p>
            )}
            <Link href="/">
              <Button variant="outline">Return to Home</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleUnsubscribe} className="glass rounded-xl p-6">
            {errorParam && (
              <p className="text-sm text-red-400 mb-4">
                {errorParam === 'rate_limit'
                  ? 'Too many attempts. Please try again later.'
                  : 'That unsubscribe link is invalid or has expired. Enter your email below to unsubscribe.'}
              </p>
            )}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Enter your email address
              </label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !email}
            >
              {loading ? 'Processing...' : 'Unsubscribe'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-4">
              This will remove you from the Daily Kin newsletter only.
            </p>
          </form>
        )}
      </div>
    </div>
  )
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <UnsubscribeContent />
    </Suspense>
  )
}
