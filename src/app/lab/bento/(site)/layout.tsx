import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { site, SiteFooter, SiteNav } from '@/components/bento-lab/site'

export const metadata: Metadata = {
  title: { default: 'Pleiad: a survey map for the people in your life', template: '%s · Pleiad' },
  description:
    'One map per person: Human Design, the 260-day count, astrology and numerology. Add a second person to see every tie, weighted by how rare it is.',
  robots: { index: false, follow: false },
}

/** Marketing pages of the bento site (docs/redesign/BENTO_SITE.md). */
export default function SiteLayout({ children }: { readonly children: ReactNode }) {
  return (
    <>
      <SiteNav />
      <main id="main" className={site.underBar}>
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
