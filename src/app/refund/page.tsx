import { Metadata } from 'next'
import { LiveLegalCard } from '@/components/bento-lab/docs/live-legal-card'
import { LEGAL_DOCS } from '@/lib/site/legal'

const doc = LEGAL_DOCS.refund

export const metadata: Metadata = {
  title: `${doc.title} | Pleiad`,
  description: doc.description,
  robots: {
    index: true,
    follow: true,
  },
}

export default function RefundPage() {
  return <LiveLegalCard doc={doc} />
}
