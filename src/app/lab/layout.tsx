import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Bento lab',
  robots: { index: false, follow: false },
}

/**
 * The redesign experiments (docs/redesign/BENTO_SITE.md). Not indexed, not in
 * the sitemap. The theme root (LabRoot) is provided once by the root layout
 * now that the tree is promoted, so this layer only holds the noindex flag.
 */
export default function LabLayout({ children }: { readonly children: ReactNode }) {
  return <>{children}</>
}
