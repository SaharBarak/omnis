import type { Metadata } from 'next'
import Link from 'next/link'
import { ContactForm } from '@/components/bento-lab/docs/contact-form'
import { DocumentPage, type DocumentSection } from '@/components/bento-lab/docs/document-page'
import { CONTACT_ADDRESS } from '@/lib/site/legal'
import { siteHref } from '@/lib/site/routes'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Write to Pleiad about a reading, your account or a purchase.',
}

const SECTIONS: readonly DocumentSection[] = [
  {
    id: 'message',
    title: 'Send a message',
    children: <ContactForm fallbackAddress={CONTACT_ADDRESS.support} />,
  },
  {
    id: 'email',
    title: 'Email',
    children: (
      <>
        <p>
          Purchases, refunds and your account:{' '}
          <a href={`mailto:${CONTACT_ADDRESS.support}`}>{CONTACT_ADDRESS.support}</a>
        </p>
        <p>
          Privacy and data requests: <a href={`mailto:${CONTACT_ADDRESS.privacy}`}>{CONTACT_ADDRESS.privacy}</a>
        </p>
      </>
    ),
  },
  {
    id: 'refunds',
    title: 'Before you ask for a refund',
    children: (
      <p>
        Apple and Google take the payment and decide refunds. The <Link href={siteHref('/refund')}>Refund Policy</Link>{' '}
        links to the request page for each store.
      </p>
    ),
  },
]

export default function ContactPage() {
  return (
    <DocumentPage
      eyebrow="Contact"
      title="Write to us"
      lead="A person reads each message and replies within two business days."
      sections={SECTIONS}
    />
  )
}
