'use client'

import Script from 'next/script'
import { GoogleAnalytics } from '@next/third-parties/google'
import { ConsentBanner } from './consent-banner'
import { useConsentGate } from '@/lib/analytics/consent-store'

/**
 * The consent decision governs every non-essential tracker on the site, not
 * only PostHog. Mounted once in the root layout.
 *
 * - PostHog is initialised in `src/instrumentation-client.ts` and told the
 *   answer by the consent store; it sends nothing while the answer is pending.
 * - Google Analytics and the studio beacon set or may set identifiers, so
 *   their tags are not injected until the visitor is known to have accepted.
 * - Cloudflare Web Analytics stores nothing in the browser and stays in the
 *   layout, outside this gate.
 */
export function ConsentedTrackers() {
  const gate = useConsentGate()

  return (
    <>
      <ConsentBanner />
      {gate === 'allowed' && (
        <>
          <Script
            src="https://clever-swan-577.convex.site/beacon.js"
            data-slug="omnis"
            strategy="afterInteractive"
          />
          {process.env.NODE_ENV === 'production' && (
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA4_ID ?? 'G-TLTK4LHGW3'} />
          )}
        </>
      )}
    </>
  )
}
