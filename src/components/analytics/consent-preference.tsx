'use client'

import { isSettled } from '@/lib/analytics/consent'
import { answerConsent, useConsentGate } from '@/lib/analytics/consent-store'

/**
 * Changing the answer later, from the privacy page. Withdrawing consent has to
 * be as easy as giving it. Renders nothing until there is an answer to change;
 * before that the banner is already making the same offer.
 */
export function ConsentPreference() {
  const gate = useConsentGate()
  if (!isSettled(gate)) return null

  const isAllowed = gate === 'allowed'
  return (
    <p>
      Analytics cookies are currently <strong>{isAllowed ? 'allowed' : 'declined'}</strong> in
      this browser.{' '}
      <button
        type="button"
        className="underline underline-offset-4"
        onClick={() => answerConsent(isAllowed ? 'denied' : 'granted')}
      >
        {isAllowed ? 'Decline them' : 'Allow them'}
      </button>
    </p>
  )
}
