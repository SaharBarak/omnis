'use client'

import Link from 'next/link'
import { answerConsent, useConsentGate } from '@/lib/analytics/consent-store'

const CHOICE_BUTTON =
  'rounded-full px-5 py-2.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-soft'

/**
 * The question asked before anything non-essential loads, shown only where it
 * is required (see lib/analytics/consent.ts).
 *
 * Not a modal: nothing is blocked or dimmed, and a visitor who ignores it
 * reads the site with no analytics running. The two answers weigh the same.
 */
export function ConsentBanner() {
  const gate = useConsentGate()
  if (gate !== 'asking') return null

  return (
    <div
      role="region"
      aria-label="Analytics cookies"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#0B0D16]/95 px-6 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-sm text-white/70">
          May we measure how Pleiad is used? PostHog and Google Analytics would set
          identifiers in your browser to count pages and actions. Nothing is loaded
          until you answer.{' '}
          <Link href="/privacy" className="underline underline-offset-4">
            What we collect
          </Link>
          .
        </p>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => answerConsent('denied')}
            className={`${CHOICE_BUTTON} border border-white/15 text-white/80 hover:bg-white/5`}
          >
            Decline
          </button>
          <button
            type="button"
            onClick={() => answerConsent('granted')}
            className={`${CHOICE_BUTTON} bg-brand text-white hover:bg-brand/90`}
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  )
}
