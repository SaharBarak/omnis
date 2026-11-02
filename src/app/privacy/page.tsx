import { Metadata } from 'next'
import { LiveLegalCard } from '@/components/bento-lab/docs/live-legal-card'
import { LEGAL_DOCS } from '@/lib/site/legal'

const doc = LEGAL_DOCS.privacy

export const metadata: Metadata = {
  title: `${doc.title} | Pleiad`,
  description: doc.description,
  robots: {
    index: true,
    follow: true,
  },
}

export default function PrivacyPage() {
  return <LiveLegalCard doc={doc} listClassName="list-disc pl-6 space-y-1" backHref="/login" />
}
