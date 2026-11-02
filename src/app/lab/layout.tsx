import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { LabRoot } from '@/components/bento-lab'

export const metadata: Metadata = {
  title: 'Bento lab',
  robots: { index: false, follow: false },
}

/** The redesign lab (docs/redesign/BENTO_SITE.md). Not indexed, not in the sitemap. */
export default function LabLayout({ children }: { readonly children: ReactNode }) {
  return <LabRoot>{children}</LabRoot>
}
