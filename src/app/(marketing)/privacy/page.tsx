import type { Metadata } from 'next'
import { LegalDocument } from '@/components/bento-lab/docs/legal-document'
import { LEGAL_DOCS } from '@/lib/site/legal'

const doc = LEGAL_DOCS.privacy

export const metadata: Metadata = { title: doc.title, description: doc.description }

export default function Page() {
  return <LegalDocument doc={doc} />
}
