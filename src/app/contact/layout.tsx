import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact OmnisX - Get in Touch',
  description: 'Have questions about OmnisX, Dreamspell, Human Design, or your cosmic blueprint? Contact our team. We typically respond within 24 hours.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact OmnisX - Get in Touch',
    description: 'Questions about OmnisX? Contact our team.',
    url: '/contact',
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
