'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Where /api/newsletter/confirm lands the user after a double opt-in click.
 * Mirrors the /unsubscribe page: the route does the work, this only reports it.
 */
function ConfirmedContent() {
  const searchParams = useSearchParams()
  const success = searchParams.get('success') === 'true'
  const errorParam = searchParams.get('error')

  const message = success
    ? "You're subscribed. Today's Kin lands in your inbox each morning."
    : errorParam === 'rate_limit'
      ? 'Too many attempts. Please try again in a little while.'
      : 'That confirmation link is invalid or has expired. Links last 7 days — sign up again to get a fresh one.'

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="text-accent text-2xl">*</span>
            <span className="font-bold text-xl">PLEIAD</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">
            {success ? 'Subscription confirmed' : 'Confirmation failed'}
          </h1>
        </div>

        <div
          className={`glass rounded-xl p-6 text-center ${success ? 'border-green-500/30' : 'border-red-500/30'}`}
        >
          <div className={`text-4xl mb-4 ${success ? 'text-green-500' : 'text-red-500'}`}>
            {success ? '✓' : '✗'}
          </div>
          <p className={`mb-6 ${success ? 'text-green-400' : 'text-red-400'}`}>{message}</p>
          <Link href={success ? '/today' : '/'}>
            <Button variant="outline">{success ? "View Today's Kin" : 'Return to Home'}</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function NewsletterConfirmedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <ConfirmedContent />
    </Suspense>
  )
}
