import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { frame } from '@/components/bento-v2'
import { DIGEST } from '@/lib/atlas/layers'
import { spelled } from '@/lib/site/number-words'

export const metadata: Metadata = {
  title: { default: 'Pleiad v2: map every person, see every tie', template: '%s · Pleiad v2' },
  description: `One map per person from ${spelled(DIGEST.length)} systems, and every tie between two people weighed by how rare it is.`,
  robots: { index: false, follow: false },
}

/** Bento v2 (docs/redesign/BENTO_V2.md): the frame language for every v2 page. The scroll engines belong to the home alone. */
export default function BentoV2Layout({ children }: { readonly children: ReactNode }) {
  return <div className={frame.page}>{children}</div>
}
